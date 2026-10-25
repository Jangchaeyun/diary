const base = process.env.DIARY_URL ?? "http://127.0.0.1:3000";
let cookie = "";

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const set = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  if (set.length) cookie = set.map((item) => item.split(";")[0]).join("; ");
  const type = response.headers.get("content-type") ?? "";
  const body = type.includes("application/json") ? await response.json() : await response.arrayBuffer();
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const stamp = Date.now();
const locked = await request("/api/entries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "잠긴 기록",
    body: "로그인 전에는 저장되지 않아야 해요.",
    mood: "calm",
    theme: "ivory",
    entryDate: "2026-10-24",
    status: "saved",
  }),
});
assert(locked.status === 401, `unauthenticated create should fail ${locked.status}`);

const account = await request("/api/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mode: "signup",
    name: "스모크",
    email: `smoke-${stamp}@example.com`,
    password: "smoke-pass-1234",
  }),
});
assert(account.status === 200 && account.body.user.email.includes("smoke-"), `signup failed ${account.status}`);

const created = await request("/api/entries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "창가의 오후",
    body: "비가 그친 뒤 창문을 열어 두었다. 차 한 잔이 따뜻했다.",
    mood: "calm",
    theme: "sage",
    entryDate: "2026-10-24",
    status: "saved",
  }),
});
assert(created.status === 201, `create failed ${created.status} ${JSON.stringify(created.body)}`);
const id = created.body.entry.id;

const loaded = await request(`/api/entries/${id}`);
assert(loaded.status === 200 && loaded.body.entry.title === "창가의 오후", "read failed");

const searched = await request("/api/entries?q=" + encodeURIComponent("창문"));
assert(searched.body.entries.some((entry) => entry.id === id), "search failed");

const status = await request("/api/ai/status");
assert(typeof status.body.configured === "boolean", "ai status failed");

const live = await request(`/api/entries/${id}/ai`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "summary", mode: "live" }),
});
if (!status.body.configured) {
  assert(live.status === 503 && live.body.code === "not_configured", "live should report missing API");
} else {
  assert(live.status === 200 && live.body.entry.ai.summary.source === "llm", "live summary failed");
}

const test = await request(`/api/entries/${id}/ai`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "summary", mode: "test", force: true, includePhotos: true }),
});
assert(test.status === 200 && test.body.entry.ai.summary.source === "test", "test summary failed");
assert(String(test.body.entry.ai.summary.payload.summary).includes("테스트 예시"), "test summary not labeled");

const monthly = await request("/api/insights/monthly", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ month: "2026-10", mode: "test" }),
});
assert(monthly.status === 200 && monthly.body.status === "insufficient", "monthly should refuse a thin month");

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const form = new FormData();
form.set("file", new File([png], "dot.png", { type: "image/png" }));
const photo = await request(`/api/entries/${id}/photos`, { method: "POST", body: form });
assert(photo.status === 201, `photo upload failed ${photo.status} ${JSON.stringify(photo.body)}`);
const image = await request(`/api/photos/${photo.body.photo.id}`);
assert(image.status === 200 && image.body.byteLength > 10, "photo read failed");

const exported = await request("/api/export");
const zip = Buffer.from(exported.body);
assert(exported.status === 200 && zip[0] === 0x50 && zip[1] === 0x4b, "export zip failed");

const storage = await request("/api/account");
assert(storage.body.storage.mode === "local" || storage.body.storage.mode === "s3", "storage status failed");

const ownerCookie = cookie;
const other = await request("/api/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mode: "signup",
    name: "다른 사람",
    email: `other-${stamp}@example.com`,
    password: "other-pass-1234",
  }),
});
assert(other.status === 200, "second signup failed");
const hidden = await request(`/api/entries/${id}`);
assert(hidden.status === 404, "other user could read the diary");
const hiddenPhoto = await request(`/api/photos/${photo.body.photo.id}`);
assert(hiddenPhoto.status === 404, "other user could read the photo");

cookie = ownerCookie;
const still = await request(`/api/entries/${id}`);
assert(still.status === 200, "owner lost the diary");

const removed = await request(`/api/entries/${id}`, { method: "DELETE" });
assert(removed.status === 200, "delete failed");
const missing = await request(`/api/entries/${id}`);
assert(missing.status === 404, "deleted entry still exists");

console.log("smoke ok");
