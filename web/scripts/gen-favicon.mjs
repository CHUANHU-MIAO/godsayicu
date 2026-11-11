/**
 * 由 app/icon.svg 生成多尺寸 app/favicon.ico。
 * ICO 容器内嵌 PNG（Windows Vista+ / 现代浏览器均支持），无需 ImageMagick 或 Pillow。
 * 用法：node scripts/gen-favicon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const svgPath = path.join(root, 'app', 'icon.svg');
const icoPath = path.join(root, 'app', 'favicon.ico');
const previewDir = path.resolve(root, '..', '.screenshots');
const previewPath = path.join(previewDir, 'icu-logo-preview.png');

const svg = fs.readFileSync(svgPath);
const sizes = [16, 32, 48, 64, 128, 256];

const pngs = [];
for (const size of sizes) {
  pngs.push(
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'fill', kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // resource type: icon
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size, index) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width, 0 = 256
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngs[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += pngs[index].length;
  return entry;
});

fs.writeFileSync(icoPath, Buffer.concat([header, ...entries, ...pngs]));

fs.mkdirSync(previewDir, { recursive: true });
await sharp(svg, { density: 768 }).resize(512, 512).png().toFile(previewPath);

console.log('favicon.ico:', fs.statSync(icoPath).size, 'bytes,', sizes.join('/'), 'px');
console.log('preview:', previewPath);
