import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
// Prefer local copy; fallback to Cursor project assets
const srcPath = fs.existsSync(path.join(projectRoot, 'assets/app-icon-source.png'))
  ? path.join(projectRoot, 'assets/app-icon-source.png')
  : path.join(projectRoot, '../../../.cursor/projects/Users-oz-s-github-dor-games-export/assets/IMG_0053-7d09709c-2731-47aa-9218-22ec9944b781.png');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(srcPath)) {
  console.error('Source image not found:', srcPath);
  process.exit(1);
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-180.png', size: 180 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

const image = sharp(srcPath);

for (const { name, size } of sizes) {
  await image
    .clone()
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, name));
  console.log(`Created ${name} (${size}x${size})`);
}

console.log('Done!');
