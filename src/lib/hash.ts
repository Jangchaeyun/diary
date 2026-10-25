import { createHash } from "crypto";

export function hashContent(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function entryContentHash(entry: {
  title: string;
  body: string;
  mood: string | null;
  entryDate: string;
}) {
  return hashContent([entry.entryDate, entry.mood ?? "", entry.title, entry.body].join("\n"));
}
