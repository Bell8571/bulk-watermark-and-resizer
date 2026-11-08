import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(
  path.join(root, 'Bulk Image Watermarker and Resizer.html'),
  'utf8',
);
const m = html.match(/<style>\s*([\s\S]*?)\s*<\/style>/);
if (!m) throw new Error('no style block');
let css = m[1];
css = css.replace(
  /\.progress-fill \{[\s\S]*?transition: width 0\.3s ease;\s*\}\s*text-align:/,
  `.progress-fill {
            height: 100%;
            background: linear-gradient(to right, #0099cc, #00d4ff);
            width: 0%;
            transition: width 0.3s ease;
        }

        footer { text-align:`,
);
const extra = `
.app-footer-version { font-size: 0.9rem; opacity: 0.85; margin-top: 8px; }

.debug-card details summary {
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
    color: var(--color-text-muted);
    margin-bottom: 12px;
}
.debug-card details summary::-webkit-details-marker { display: none; }
.debug-card.is-prod:not(.debug-expanded) .debug-console { display: none; }

.btn:focus-visible,
.form-control:focus-visible,
.preview-filter:focus-visible,
.settings-btn:focus-visible,
.preset-btn:focus-visible,
.position-btn:focus-visible,
.watermark-type-btn:focus-visible,
.resize-mode-btn:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
}

.stat-value--sm { font-size: 1rem; font-weight: 600; color: var(--color-accent); }
`;
fs.writeFileSync(
  path.join(root, 'src/styles/app.css'),
  `@import './tokens.css';\n\n${css}\n${extra}`,
);
