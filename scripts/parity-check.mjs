import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

const requiredIds = [
  'exportSettingsBtn',
  'importSettingsBtn',
  'resetSettingsBtn',
  'debugConsole',
  'outputFilenamePattern',
  'statProgress',
  'appVersionFooter',
];

const missing = requiredIds.filter((id) => !index.includes(`id="${id}"`));
if (missing.length) {
  console.error('Missing UI ids:', missing.join(', '));
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const exe = path.join(root, 'release', pkg.version, `ProPhoto-Watermarker-${pkg.version}.exe`);
if (!fs.existsSync(exe)) {
  console.warn('Portable exe not staged — run npm run dist:win && npm run release');
} else {
  console.log('Portable exe present:', exe);
}

console.log('Parity check: UI scaffold OK (manual upload/process/ZIP test in browser or exe).');
