import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 128;
  const fillRect = (left, top, right, bottom, color) => {
    const x0 = Math.floor(left * scale);
    const y0 = Math.floor(top * scale);
    const x1 = Math.ceil(right * scale);
    const y1 = Math.ceil(bottom * scale);
    for (let y = y0; y < Math.min(y1, size); y += 1) {
      for (let x = x0; x < Math.min(x1, size); x += 1) {
        const offset = (y * size + x) * 4;
        pixels.set(color, offset);
      }
    }
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = (x + 0.5) / scale;
      const py = (y + 0.5) / scale;
      const radius = 23;
      const dx = Math.max(radius - px, 0, px - (128 - radius));
      const dy = Math.max(radius - py, 0, py - (128 - radius));
      if (dx * dx + dy * dy <= radius * radius) pixels.set([37, 96, 232, 255], (y * size + x) * 4);
    }
  }

  fillRect(28, 70, 43, 98, [255, 255, 255, 255]);
  fillRect(53, 52, 68, 98, [255, 255, 255, 255]);
  fillRect(78, 34, 93, 98, [255, 255, 255, 255]);
  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) pixels.copy(scanlines, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND"),
  ]);
}

await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });
for (const size of [16, 48, 128]) {
  await writeFile(new URL(`../public/icons/icon${size}.png`, import.meta.url), createIcon(size));
}
