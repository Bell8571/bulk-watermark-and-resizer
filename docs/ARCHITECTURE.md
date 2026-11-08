# Architecture

## Overview

ProPhoto is a client-side image pipeline: files stay on the user's machine; Canvas API performs resize and watermarking; JSZip packages exports.

```mermaid
flowchart TD
  ui[index.html + app.css]
  main[main.js]
  settings[settings.js]
  preview[preview.js]
  process[processing.js]
  download[download.js]
  loader[imageLoader.js]
  ui --> main
  main --> settings
  main --> preview
  main --> process
  main --> download
  process --> loader
  preview --> loader
  process --> download
```

## Build outputs

| Command | Output |
|---------|--------|
| `npm run dev` | Vite dev server at `:5173` |
| `npm run build` | Static bundle in `dist/` |
| `npm run dist:win` | Portable `.exe` in `dist-electron/` |
| `npm run release` | Copies exe + docs into `release/<version>/` and writes `SHA256.txt` |

## Electron

[`electron/main.cjs`](../electron/main.cjs) loads the Vite dev URL during development or `dist/index.html` in production.
