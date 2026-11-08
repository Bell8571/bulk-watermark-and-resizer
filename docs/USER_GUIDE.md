# ProPhoto Watermarker & Resizer — User Guide

## Quick start

1. Upload images (drag-and-drop or **Select Images**).
2. Set resize and watermark options; watch the live preview on the first image.
3. Click **Process Images**, then **Download ZIP**.

## Settings

- **Export Settings** — save configuration as JSON.
- **Import Settings** — load a saved JSON preset.
- **Reset Defaults** — restore factory settings (with confirmation).

Settings are also saved automatically in your browser or desktop app profile.

## Output filenames

Use **Output filename pattern** with tokens:

- `{basename}` — original name without extension
- `{ext}` — original extension

Example: `{basename}_watermarked` → `photo_watermarked.jpg`

## Preview filters

Use **All**, **Source**, or **Processed** to filter the batch preview. **Remove Mode** lets you click thumbnails to drop files from the batch.

## Limits

- 50 files per batch, 50 MB per file
- JPEG, PNG, WebP, GIF, BMP
