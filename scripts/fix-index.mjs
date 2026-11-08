import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const file = path.join(root, 'src/index.html');
let html = fs.readFileSync(file, 'utf8');

const endFooter = html.indexOf('</footer>');
if (endFooter === -1) throw new Error('footer not found');
html = html.slice(0, endFooter + '</footer>'.length);
html = `${html}
    </div>
`;

html = html.replace(
  /<button type="button" class="preset-btn"[^>]*>/g,
  (line) => {
    const w = line.match(/data-preset-w="(\d+)"/)?.[1];
    const h = line.match(/data-preset-h="(\d+)"/)?.[1];
    if (w && h) return `<button type="button" class="preset-btn preset-dimension" data-preset-w="${w}" data-preset-h="${h}">`;
    return line;
  },
);

if (!html.includes('outputFilenamePattern')) {
  html = html.replace(
    `<option value="low">JPG 75% (Optimized)</option>
                        </select>
                    </div>
                </div>`,
    `<option value="low">JPG 75% (Optimized)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="outputFilenamePattern">Output filename pattern</label>
                        <input type="text" id="outputFilenamePattern" class="form-control" value="{basename}_watermarked" placeholder="{basename}_watermarked">
                        <small style="opacity:0.75">Tokens: {basename}, {ext}</small>
                    </div>
                </div>`,
  );
}

html = html.replace(
  `<div class="card">
            <h2 class="card-title"><i class="fas fa-terminal"></i> Debug Console</h2>
            <button type="button" class="settings-btn" id="clearDebugBtn"><i class="fas fa-trash"></i> Clear Log</button>
            <div class="debug-console" id="debugConsole">`,
  `<div class="card debug-card" id="debugCard">
            <h2 class="card-title"><i class="fas fa-terminal"></i> Debug Console</h2>
            <details id="debugDetails">
                <summary><i class="fas fa-code"></i> Advanced — show debug log</summary>
            </details>
            <button type="button" class="settings-btn" id="clearDebugBtn"><i class="fas fa-trash"></i> Clear Log</button>
            <div class="debug-console" id="debugConsole">`,
);

html = html.replace(
  `<footer>
            <p>© 2024 ProPhoto Watermarker & Resizer • Professional tools for photographers • © BellCorporateLabs</p>
        </footer>`,
  `<footer class="app-footer">
            <p>ProPhoto Watermarker & Resizer • Professional tools for photographers • © BellCorporateLabs</p>
            <p class="app-footer-version" id="appVersionFooter"></p>
        </footer>`,
);

const out = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProPhoto Watermarker & Resizer</title>
    <link rel="stylesheet" href="./styles/app.css">
</head>
<body>
${html.replace(/^<!DOCTYPE html>[\s\S]*?<body>\s*/i, '').trim()}
    <script type="module" src="./js/main.js"></script>
</body>
</html>
`;

fs.writeFileSync(file, out);
