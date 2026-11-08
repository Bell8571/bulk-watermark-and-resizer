import JSZip from 'jszip';
import { appState } from './state.js';
import { logger } from './logger.js';
import { sanitizeInput } from './validation.js';

export function formatOutputFilename(originalName) {
  const pattern =
    document.getElementById('outputFilenamePattern')?.value?.trim() || '{basename}_watermarked';
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot + 1).toLowerCase() : 'jpg';
  const mimeDefault =
    document.getElementById('resizeQuality')?.value === 'high' ? 'png' : 'jpg';

  let result = pattern
    .replace(/\{basename\}/g, base)
    .replace(/\{ext\}/g, ext || mimeDefault);

  if (!pattern.includes('{ext}') && !/\.\w+$/.test(result)) {
    result += `.${ext || mimeDefault}`;
  }
  return result.replace(/[<>:"/\\|?*]/g, '_');
}

export async function downloadAsZip() {
  if (appState.processedImages.length === 0) {
    alert('No processed images to download.');
    return;
  }

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = true;
  downloadBtn.textContent = '⏳ Creating ZIP...';

  try {
    const zip = new JSZip();
    const folder = zip.folder('processed-images');
    const BATCH_SIZE = 5;

    for (let i = 0; i < appState.processedImages.length; i += BATCH_SIZE) {
      const batch = appState.processedImages.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const dataUrl = item.canvas.toDataURL(
              item.canvas.mimeType || 'image/jpeg',
              item.canvas.qualityValue || 0.92,
            );
            const base64Data = dataUrl.split(',')[1];
            const safeOriginal = sanitizeInput(item.name) || item.name;
            const outName = formatOutputFilename(safeOriginal);
            folder.file(outName, base64Data, { base64: true });
          } catch {
            logger.warning(`Skipped file in ZIP: ${item.name}`);
          }
        }),
      );
      await new Promise((r) => setTimeout(r, 10));
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `watermarked-images-${dateStr}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    logger.success(`ZIP created with ${appState.processedImages.length} images`);
  } catch (error) {
    logger.error('ZIP creation failed', error);
    alert('Failed to create ZIP file.');
  }

  downloadBtn.disabled = false;
  downloadBtn.textContent = 'Download ZIP';
}
