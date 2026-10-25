import path from "node:path";

export function dataDirectory() {
  if (process.env.VERCEL) return path.join("/tmp", "diary-data");
  return path.join(process.cwd(), "data");
}
