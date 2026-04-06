import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const svgPath = path.resolve('src/app/icon.svg');
const svg = fs.readFileSync(svgPath);

const outputs = [
  { size: 192, out: 'public/icon-192.png' },
  { size: 512, out: 'public/icon-512.png' },
  { size: 180, out: 'public/apple-icon.png' },
  { size: 32, out: 'public/favicon-32.png' },
];

for (const { size, out } of outputs) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log('generated:', out);
}
