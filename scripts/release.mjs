import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const releaseDir = path.join(root, 'release', version);
const distElectron = path.join(root, 'dist-electron');

fs.mkdirSync(releaseDir, { recursive: true });

const exeName = `ProPhoto-Watermarker-${version}.exe`;
let exePath = path.join(distElectron, exeName);
if (!fs.existsSync(exePath)) {
  const matches = fs.existsSync(distElectron)
    ? fs.readdirSync(distElectron).filter((f) => f.endsWith('.exe'))
    : [];
  if (matches.length) exePath = path.join(distElectron, matches[0]);
}

const copy = (src, dest) => {
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(releaseDir, dest));
};

copy(path.join(root, 'LICENSE.txt'), 'LICENSE.txt');
copy(path.join(root, 'CHANGELOG.md'), 'CHANGELOG.md');
copy(path.join(root, 'release', version, 'RELEASE_NOTES.md'), 'RELEASE_NOTES.md');
copy(path.join(root, 'release', version, 'README.md'), 'README.md');

if (fs.existsSync(exePath)) {
  const destExe = path.join(releaseDir, path.basename(exePath));
  fs.copyFileSync(exePath, destExe);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(destExe)).digest('hex');
  fs.writeFileSync(
    path.join(releaseDir, 'SHA256.txt'),
    `${hash}  ${path.basename(destExe)}\n`,
  );
  console.log(`Release staged: ${destExe}`);
} else {
  console.warn('No .exe found in dist-electron — run npm run dist:win first.');
}

console.log(`Artifacts in ${releaseDir}`);
