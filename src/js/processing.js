import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
  SUPPORTED_FORMATS,
} from './constants.js';
import { appState } from './state.js';
import { logger } from './logger.js';
import { isLightColor, sanitizeInput, validateFileForImport } from './validation.js';
import { loadOrientedImageFromFile, releaseDrawable } from './imageLoader.js';
import {
  updateBatchStats,
  updateLivePreview,
  updatePreview,
  updateThumbnailGallery,
} from './preview.js';
import { persistSettingsDebounced } from './settings.js';

export function calculateTargetDimensions(originalWidth, originalHeight) {
  if (appState.currentResizeMode === 'percentage') {
    const percent = parseInt(document.getElementById('resizePercentage').value, 10) / 100;
    return {
      width: Math.floor(originalWidth * percent),
      height: Math.floor(originalHeight * percent),
    };
  }
  let width = parseInt(document.getElementById('resizeWidth').value, 10);
  let height = parseInt(document.getElementById('resizeHeight').value, 10);

  if (appState.constrainProportions) {
    const ratio = originalWidth / originalHeight;
    if (width / height > ratio) {
      width = Math.floor(height * ratio);
    } else {
      height = Math.floor(width / ratio);
    }
  }
  return { width, height };
}

async function processDrawable(drawable, sourceWidth, sourceHeight, targetWidth, targetHeight, exportMode) {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(drawable, 0, 0, targetWidth, targetHeight);

  const position = appState.currentPosition;
  const opacity = parseInt(document.getElementById('watermarkOpacity').value, 10) / 100;
  ctx.save();
  ctx.globalAlpha = opacity;
  const padding = Math.min(targetWidth, targetHeight) * 0.04;

  let x;
  let y;
  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = targetWidth / 2;
      y = padding;
      break;
    case 'top-right':
      x = targetWidth - padding;
      y = padding;
      break;
    case 'middle-left':
      x = padding;
      y = targetHeight / 2;
      break;
    case 'center':
      x = targetWidth / 2;
      y = targetHeight / 2;
      break;
    case 'middle-right':
      x = targetWidth - padding;
      y = targetHeight / 2;
      break;
    case 'bottom-left':
      x = padding;
      y = targetHeight - padding;
      break;
    case 'bottom-center':
      x = targetWidth / 2;
      y = targetHeight - padding;
      break;
    case 'bottom-right':
      x = targetWidth - padding;
      y = targetHeight - padding;
      break;
    default:
      x = targetWidth - padding;
      y = targetHeight - padding;
  }

  if (appState.currentWatermarkType === 'text') {
    const text = document.getElementById('watermarkText').value || 'WATERMARK';
    const font = document.getElementById('watermarkFont').value || 'Arial';
    const color = document.getElementById('watermarkColor').value || '#ffffff';
    const fontSize = Math.max(24, Math.floor(targetWidth / 20));
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.strokeStyle = isLightColor(color) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, fontSize / 16);
    ctx.textAlign = position.includes('right') ? 'right' : position.includes('center') ? 'center' : 'left';
    ctx.textBaseline =
      position.includes('bottom') ? 'bottom' : position.includes('middle') || position === 'center' ? 'middle' : 'top';
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  } else if (appState.currentWatermarkType === 'image' && appState.watermarkImage) {
    const scale = parseInt(document.getElementById('watermarkImageScale').value, 10) / 100;
    const logoW = appState.watermarkImage.width * scale;
    const logoH = appState.watermarkImage.height * scale;
    let drawX = x;
    let drawY = y;
    if (position.includes('center')) drawX -= logoW / 2;
    if (position.includes('right')) drawX -= logoW;
    if (position.includes('middle') || position === 'center') drawY -= logoH / 2;
    if (position.includes('bottom')) drawY -= logoH;
    ctx.drawImage(appState.watermarkImage, drawX, drawY, logoW, logoH);
  }
  ctx.restore();

  const mimeType = exportMode === 'high' ? 'image/png' : 'image/jpeg';
  const quality = exportMode === 'medium' ? 0.92 : exportMode === 'low' ? 0.75 : 1.0;
  canvas.mimeType = mimeType;
  canvas.qualityValue = quality;
  return canvas;
}

export async function processAllImages() {
  if (appState.uploadedFiles.length === 0) {
    alert('Please upload images first.');
    return;
  }
  if (!window.ProcessingRateLimiter.canProcess()) {
    alert('Please wait before processing again.');
    return;
  }

  const processBtn = document.getElementById('processBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  processBtn.disabled = true;
  processBtn.textContent = '⏳ Processing...';
  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  appState.processingStatus = 'Starting batch…';
  updateBatchStats();

  appState.processedImages = [];
  const exportMode = document.getElementById('resizeQuality').value;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < appState.uploadedFiles.length; i++) {
    const file = appState.uploadedFiles[i];
    appState.processingStatus = `Processing ${i + 1}/${appState.uploadedFiles.length}: ${file.name}`;
    updateBatchStats();

    let drawable;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Processing timeout')), 30000),
      );
      const loaded = await loadOrientedImageFromFile(file);
      drawable = loaded.drawable;
      const { width, height } = calculateTargetDimensions(loaded.width, loaded.height);
      if (width < 10 || height < 10 || width > 16000 || height > 16000) {
        throw new Error(`Invalid dimensions for ${file.name}`);
      }
      const processingPromise = processDrawable(drawable, loaded.width, loaded.height, width, height, exportMode);
      const canvas = await Promise.race([processingPromise, timeoutPromise]);
      const safeName = sanitizeInput(file.name) || file.name;
      appState.processedImages.push({ name: safeName, canvas });
      successCount++;
    } catch (error) {
      failCount++;
      logger.error(`Failed: ${file.name}`, error);
    } finally {
      if (drawable) releaseDrawable(drawable);
    }

    const progress = Math.round(((i + 1) / appState.uploadedFiles.length) * 100);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}% (${successCount} ok, ${failCount} fail)`;
    await new Promise((r) => setTimeout(r, 0));
  }

  processBtn.disabled = false;
  processBtn.textContent = 'Process Images';
  downloadBtn.disabled = appState.processedImages.length === 0;
  appState.processingStatus = `Done (${successCount} ok, ${failCount} fail)`;
  updatePreview();
  updateBatchStats();
  progressText.textContent = `Done: ${successCount} processed, ${failCount} failed`;

  if (failCount > 0) logger.warning(`Batch complete with ${failCount} failures`);
  else logger.success(`Batch complete: ${successCount} images`);
  persistSettingsDebounced();
}

export function handleFiles(files) {
  if (!files || typeof files.length !== 'number' || files.length === 0) {
    logger.warning('No files provided');
    return;
  }
  if (!window.ProcessingRateLimiter.canProcess()) {
    alert('Please wait before processing again.');
    return;
  }

  const candidates = Array.from(files);
  const accepted = [];
  let rejected = 0;

  for (const file of candidates) {
    if (!validateFileForImport(file)) {
      rejected++;
      continue;
    }
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      rejected++;
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejected++;
      continue;
    }
    accepted.push(file);
  }

  if (accepted.length === 0) {
    alert(
      `No valid images imported.\n\nSupported: JPEG, PNG, WebP, GIF, BMP\nMax: ${MAX_FILE_SIZE_MB}MB per file, ${MAX_FILES} per batch`,
    );
    return;
  }

  const finalFiles = accepted.slice(0, MAX_FILES);
  if (accepted.length > MAX_FILES) logger.warning(`Trimmed to ${MAX_FILES} files`);

  if (window.ActiveObjectURLManager) window.ActiveObjectURLManager.revokeAll();
  else {
    appState.activeObjectURLs.forEach((u) => URL.revokeObjectURL(u));
    appState.activeObjectURLs = [];
  }

  appState.uploadedFiles = finalFiles;
  appState.processedImages = [];
  document.getElementById('downloadBtn').disabled = true;

  updateThumbnailGallery();
  updatePreview();
  updateBatchStats();
  updateLivePreview();

  logger.success(`Loaded ${appState.uploadedFiles.length} images`);
  if (rejected > 0) logger.warning(`Rejected ${rejected} files`);
}

export function setPreset(width, height) {
  document.getElementById('resizeWidth').value = width;
  document.getElementById('resizeHeight').value = height;
  updateLivePreview();
  logger.log(`Preset: ${width}×${height}`);
  persistSettingsDebounced();
}
