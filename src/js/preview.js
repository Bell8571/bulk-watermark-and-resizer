import { appState, revokeAllObjectURLs } from './state.js';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from './constants.js';
import { logger } from './logger.js';
import { applyWatermarkToCanvas } from './watermark.js';
import { loadOrientedImageFromFile, releaseDrawable } from './imageLoader.js';

export function updateBatchStats() {
  const batchStats = document.getElementById('batchStats');
  if (!batchStats) return;
  if (appState.uploadedFiles.length === 0) {
    batchStats.style.display = 'none';
    return;
  }
  batchStats.style.display = 'grid';
  document.getElementById('statUploaded').textContent = appState.uploadedFiles.length;
  document.getElementById('statProcessed').textContent = appState.processedImages.length;
  const qualityEl = document.getElementById('resizeQuality');
  const qualityMap = { high: 'PNG', medium: 'JPG 92%', low: 'JPG 75%' };
  document.getElementById('statFormat').textContent = qualityMap[qualityEl?.value] || 'JPG';
  const width = document.getElementById('resizeWidth')?.value || DEFAULT_WIDTH;
  const height = document.getElementById('resizeHeight')?.value || DEFAULT_HEIGHT;
  document.getElementById('statSize').textContent = `${width}×${height}`;

  const statusEl = document.getElementById('statProgress');
  if (statusEl) {
    statusEl.textContent = appState.processingStatus === 'idle' ? 'Ready' : appState.processingStatus;
  }
}

export function updateThumbnailGallery() {
  const gallery = document.getElementById('thumbnailGallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  appState.uploadedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';
    const url = URL.createObjectURL(file);
    appState.activeObjectURLs.push(url);
    item.innerHTML = `
                    <img src="${url}" alt="${file.name}">
                    <button type="button" class="thumbnail-remove" aria-label="Remove">×</button>
                `;
    item.querySelector('.thumbnail-remove').addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      appState.uploadedFiles.splice(index, 1);
      appState.processedImages = [];
      updateThumbnailGallery();
      updatePreview();
      updateBatchStats();
      updateLivePreview();
      logger.log(`Removed: ${file.name}`);
    });
    gallery.appendChild(item);
  });
}

export function updatePreview() {
  revokeAllObjectURLs();
  const container = document.getElementById('previewContainer');
  container.innerHTML = '';

  const filesToShow =
    appState.currentPreviewFilter === 'uploaded'
      ? appState.uploadedFiles
      : appState.currentPreviewFilter === 'processed'
        ? appState.processedImages.map((p) => ({ name: p.name, isCanvas: true, canvas: p.canvas }))
        : appState.uploadedFiles.length > 0
          ? appState.uploadedFiles
          : appState.processedImages.length > 0
            ? appState.processedImages.map((p) => ({ name: p.name, isCanvas: true, canvas: p.canvas }))
            : null;

  if (!filesToShow || filesToShow.length === 0) {
    container.innerHTML =
      '<div class="preview-item"><div class="placeholder"><i class="fas fa-image"></i><p>No images</p></div></div>';
    return;
  }

  filesToShow.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = appState.removalMode ? 'preview-item remove-mode' : 'preview-item';
    div.innerHTML = '<div class="remove-badge">×</div><div class="preview-item-label"></div>';
    const img = document.createElement('img');
    const label = div.querySelector('.preview-item-label');

    if (item.isCanvas && item.canvas) {
      img.src = item.canvas.toDataURL(item.canvas.mimeType || 'image/png', item.canvas.qualityValue || 1.0);
      label.textContent = `Processed: ${item.name || 'Unknown'}`;
    } else if (item instanceof File) {
      const url = URL.createObjectURL(item);
      appState.activeObjectURLs.push(url);
      img.src = url;
      label.textContent = `Source: ${item.name || 'Unknown'}`;
    } else {
      label.textContent = item.name || 'Unknown';
    }

    img.alt = item.name || 'preview';
    div.appendChild(img);

    if (appState.removalMode) {
      div.addEventListener('click', () => {
        if (appState.currentPreviewFilter === 'uploaded' || appState.currentPreviewFilter === 'all') {
          appState.uploadedFiles.splice(idx, 1);
          appState.processedImages = [];
          document.getElementById('downloadBtn').disabled = true;
          updateThumbnailGallery();
          updatePreview();
          updateBatchStats();
          updateLivePreview();
        }
      });
    }
    container.appendChild(div);
  });
}

export async function updateLivePreview() {
  const canvas = document.getElementById('livePreviewCanvas');
  if (!canvas || appState.uploadedFiles.length === 0) return;

  const ctx = canvas.getContext('2d');
  const file = appState.uploadedFiles[0];
  let drawable;
  try {
    const loaded = await loadOrientedImageFromFile(file);
    drawable = loaded.drawable;
    const maxW = 600;
    const maxH = 400;
    let w = loaded.width;
    let h = loaded.height;
    const ratio = Math.min(maxW / w, maxH / h);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);

    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(drawable, 0, 0, w, h);
    applyWatermarkToCanvas(ctx, w, h);
  } catch (e) {
    logger.warning(`Live preview failed: ${e.message}`);
  } finally {
    if (drawable) releaseDrawable(drawable);
  }
}
