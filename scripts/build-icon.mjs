import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const iconsDir = path.join(root, 'assets', 'icons');

const sourceCandidates = [
  process.env.PROPHOTO_ICON_SOURCE,
  path.join(iconsDir, 'app-source.png'),
  'C:\\Users\\BellC\\OneDrive\\Pictures\\Pooh 3.png',
].filter(Boolean);

const source = sourceCandidates.find((p) => fs.existsSync(p));
if (!source) {
  console.error('Icon source not found. Set PROPHOTO_ICON_SOURCE or place assets/icons/app-source.png');
  process.exit(1);
}

fs.mkdirSync(iconsDir, { recursive: true });
const archived = path.join(iconsDir, 'app-source.png');
if (path.resolve(source) !== path.resolve(archived)) {
  fs.copyFileSync(source, archived);
}

const squarePng = path.join(iconsDir, 'icon-square.png');
const size = 512;
await sharp(archived)
  .resize(size, size, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toFile(squarePng);

const ico = await pngToIco(squarePng);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), ico);
console.log(`Wrote assets/icons/icon.ico from ${source}`);
