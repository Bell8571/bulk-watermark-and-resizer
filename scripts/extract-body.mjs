import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Bulk Image Watermarker and Resizer.html'), 'utf8');
const m = html.match(/<body>([\s\S]*?)<\/body>/);
if (!m) throw new Error('no body');
let body = m[1].trim();
body = body.replace(
  '<div id="batchStats" class="batch-stats" style="display:none;">',
  '<div id="batchStats" class="batch-stats" style="display:none;">\n                <div class="stat-item"><span class="stat-label">Status</span><span class="stat-value stat-value--sm" id="statProgress">Ready</span></div>',
);
body = body.replace(
  '<div class="controls">',
  `<div class="settings-export-import">
                <button type="button" class="settings-btn" id="exportSettingsBtn"><i class="fas fa-file-export"></i> Export Settings</button>
                <button type="button" class="settings-btn" id="importSettingsBtn"><i class="fas fa-file-import"></i> Import Settings</button>
                <button type="button" class="settings-btn" id="resetSettingsBtn"><i class="fas fa-undo"></i> Reset Defaults</button>
                <input type="file" id="settingsInput" accept="application/json">
            </div>
            <div class="controls">`,
);
body = body.replace(
  '<motion>PLACEHOLDER',
  '',
);
// insert filename pattern after resize quality
body = body.replace(
  '</select>\n                    </div>\n                </div>\n\n                <!-- Advanced Watermark',
  `</select>
                    </div>
                    <div class="form-group">
                        <label for="outputFilenamePattern">Output filename pattern</label>
                        <input type="text" id="outputFilenamePattern" class="form-control" value="{basename}_watermarked" placeholder="{basename}_watermarked">
                        <small style="opacity:0.75">Tokens: {basename}, {ext}</small>
                    </div>
                </div>

                <!-- Advanced Watermark`,
);
body = body.replace(
  '<motion>PLACEHOLDER',
  '',
);
body = body.replace(
  `<motion>`,
  '',
);
// Debug section -> collapsible
body = body.replace(
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
body = body.replace(
  '<footer>\n            <p>© 2024 ProPhoto Watermarker & Resizer',
  '<footer class="app-footer">\n            <p>© ProPhoto Watermarker & Resizer',
);
body = body.replace(
  '© BellCorporateLabs</p>\n        </footer>',
  '© BellCorporateLabs</p>\n            <p class="app-footer-version" id="appVersionFooter"></p>\n        </footer>',
);
body = body.replace(
  /<button type="button" class="preset-btn" onclick="setPreset\((\d+), (\d+)\)">/g,
  (match, w, h) =>
    match.replace('onclick="setPreset', `data-preset-w="${w}" data-preset-h="${h}" class="preset-btn preset-dimension"`).replace(/\)">/, '">'),
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
    ${body}
    <script type="module" src="./js/main.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'src/index.html'), out);
