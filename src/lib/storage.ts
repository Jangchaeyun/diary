import { createHash, createHmac } from "node:crypto";

export type StorageStatus = {
  mode: "local" | "s3";
  host: string | null;
};

function settings() {
  const endpoint = (process.env.S3_ENDPOINT?.trim() ?? "").replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET?.trim() ?? "";
  const accessKey = process.env.S3_ACCESS_KEY?.trim() ?? "";
  const secretKey = process.env.S3_SECRET_KEY?.trim() ?? "";
  const region = process.env.S3_REGION?.trim() || "auto";
  let host: string | null = null;
  try {
    host = endpoint ? new URL(endpoint).host : null;
  } catch {
    host = null;
  }
  const configured = Boolean(endpoint && bucket && accessKey && secretKey && host);
  return { configured, endpoint, bucket, accessKey, secretKey, region, host };
}

export function storageStatus(): StorageStatus {
  const config = settings();
  return config.configured ? { mode: "s3", host: config.host } : { mode: "local", host: null };
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function encodeKey(key: string) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function signedFetch(method: string, key: string, body?: Buffer, contentType?: string) {
  const config = settings();
  if (!config.configured || !config.host) throw new Error("사진 저장소가 연결되어 있지 않아요.");
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const canonicalUri = `/${encodeKey(`${config.bucket}/${key}`)}`;
  const headers: Record<string, string> = {
    host: config.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const signedHeaders = names.join(";");
  const canonical = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretKey}`, date), config.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const response = await fetch(`${config.endpoint}${canonicalUri}`, {
    method,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: body ? new Uint8Array(body) : undefined,
  });
  return response;
}

export function objectKey(userId: string, filename: string) {
  return `photos/${userId}/${filename}`;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  const response = await signedFetch("PUT", key, body, contentType);
  if (!response.ok) throw new Error("사진 저장소에 올리지 못했어요.");
}

export async function getObject(key: string) {
  const response = await signedFetch("GET", key);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("사진 저장소에서 가져오지 못했어요.");
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(key: string) {
  const response = await signedFetch("DELETE", key);
  if (!response.ok && response.status !== 404) throw new Error("사진 저장소에서 지우지 못했어요.");
}
