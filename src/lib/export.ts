import { getMood } from "@/lib/catalog";
import { getEntryDetail, listEntries, readPhoto } from "@/lib/entries";

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files: { name: string; data: Buffer }[]) {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    const cen = Buffer.alloc(46 + name.length);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x800, 8);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(file.data.length, 20);
    cen.writeUInt32LE(file.data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    name.copy(cen, 46);
    parts.push(local, file.data);
    central.push(cen);
    offset += local.length + file.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBuf, end]);
}

export async function buildDiaryZip() {
  const listed = listEntries({ limit: 2000, offset: 0 });
  const lines = ["# 감성 다이어리", "", "이 파일은 내 계정에 저장된 일기만 담습니다.", ""];
  const files: { name: string; data: Buffer }[] = [];
  for (const item of listed.entries) {
    const entry = getEntryDetail(item.id);
    if (!entry) continue;
    const mood = getMood(entry.mood);
    lines.push(`## ${entry.entryDate} ${entry.title || "제목 없음"}`, "");
    lines.push(`기분: ${mood ? mood.label : "선택하지 않음"}`);
    lines.push(`상태: ${entry.status === "draft" ? "임시 저장" : "저장"}`, "");
    lines.push(entry.body || "(본문 없음)", "");
    for (const photo of entry.photos) {
      const file = await readPhoto(photo.id);
      if (!file) {
        lines.push("사진: 파일을 찾지 못해 이 묶음에서는 빠졌어요.", "");
        continue;
      }
      const ext = file.mime === "image/jpeg" ? "jpg" : (file.mime.split("/")[1] ?? "bin");
      const name = `사진/${entry.entryDate}-${photo.id}.${ext}`;
      files.push({ name, data: file.bytes });
      lines.push(`사진: ${name}`, "");
    }
  }
  if (listed.total > listed.entries.length) {
    lines.push("", `기록 ${listed.total}편 중 ${listed.entries.length}편만 담았어요.`);
  }
  files.unshift({ name: "일기.md", data: Buffer.from(lines.join("\n"), "utf8") });
  return zipStore(files);
}
