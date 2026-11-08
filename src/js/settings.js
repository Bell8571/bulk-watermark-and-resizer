import { appState } from './state.js';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, SETTINGS_STORAGE_KEY } from './constants.js';
import { logger } from './logger.js';
import { isValidHexColor } from './validation.js';

let persistTimer = null;

export function collectSettings() {
  return {
    watermarkText: document.getElementById('watermarkText').value,
    watermarkFont: document.getElementById('watermarkFont').value,
    watermarkColor: document.getElementById('watermarkColor').value,
    watermarkOpacity: document.getElementById('watermarkOpacity').value,
    watermarkPosition: appState.currentPosition,
    watermarkType: appState.currentWatermarkType,
    resizeMode: appState.currentResizeMode,
    resizeWidth: document.getElementById('resizeWidth').value,
    resizeHeight: document.getElementById('resizeHeight').value,
    resizePercentage: document.getElementById('resizePercentage').value,
    constrainProportions: document.getElementById('constrainProportions').checked,
    resizeQuality: document.getElementById('resizeQuality').value,
    outputFilenamePattern: document.getElementById('outputFilenamePattern')?.value || '{basename}_watermarked',
  };
}

export function applySettings(settings, { logSuccess = true } = {}) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings object');
  }

  if (settings.watermarkText !== undefined) {
    document.getElementById('watermarkText').value = String(settings.watermarkText).slice(0, 200);
  }
  if (settings.watermarkFont) document.getElementById('watermarkFont').value = settings.watermarkFont;
  if (settings.watermarkColor && isValidHexColor(settings.watermarkColor)) {
    document.getElementById('watermarkColor').value = settings.watermarkColor;
  }
  if (settings.watermarkOpacity !== undefined) {
    const v = Math.min(100, Math.max(0, parseInt(settings.watermarkOpacity, 10) || 0));
    document.getElementById('watermarkOpacity').value = v;
    const opacityValue = document.getElementById('opacityValue');
    if (opacityValue) opacityValue.textContent = `${v}%`;
  }
  if (settings.watermarkPosition) {
    appState.currentPosition = settings.watermarkPosition;
    document.querySelectorAll('#positionGrid .position-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.pos === appState.currentPosition);
    });
  }
  if (settings.watermarkType) {
    appState.currentWatermarkType = settings.watermarkType;
    document.querySelectorAll('.watermark-type-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === appState.currentWatermarkType);
    });
    document.getElementById('textWatermarkSettings').style.display =
      appState.currentWatermarkType === 'text' ? 'block' : 'none';
    document.getElementById('imageWatermarkSettings').style.display =
      appState.currentWatermarkType === 'image' ? 'block' : 'none';
  }
  if (settings.resizeMode) {
    appState.currentResizeMode = settings.resizeMode;
    document.querySelectorAll('.resize-mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === appState.currentResizeMode);
    });
    document.getElementById('dimensionsMode').style.display =
      appState.currentResizeMode === 'dimensions' ? 'block' : 'none';
    document.getElementById('percentageMode').style.display =
      appState.currentResizeMode === 'percentage' ? 'block' : 'none';
  }
  if (settings.resizeWidth) document.getElementById('resizeWidth').value = settings.resizeWidth;
  if (settings.resizeHeight) document.getElementById('resizeHeight').value = settings.resizeHeight;
  if (settings.resizePercentage) {
    document.getElementById('resizePercentage').value = settings.resizePercentage;
    const percentageValue = document.getElementById('percentageValue');
    if (percentageValue) percentageValue.textContent = `${settings.resizePercentage}%`;
  }
  if (settings.constrainProportions !== undefined) {
    document.getElementById('constrainProportions').checked = settings.constrainProportions;
    appState.constrainProportions = settings.constrainProportions;
  }
  if (settings.resizeQuality) document.getElementById('resizeQuality').value = settings.resizeQuality;
  if (settings.outputFilenamePattern) {
    const el = document.getElementById('outputFilenamePattern');
    if (el) el.value = settings.outputFilenamePattern;
  }

  if (logSuccess) logger.success('Settings applied');
}

export function exportSettingsToFile() {
  const settings = collectSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prophoto-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logger.success('Settings exported');
}

export function resetSettingsToDefaults() {
  document.getElementById('watermarkText').value = '© Your Brand';
  document.getElementById('watermarkFont').value = 'Arial';
  document.getElementById('watermarkColor').value = '#ffffff';
  document.getElementById('watermarkOpacity').value = 70;
  document.getElementById('opacityValue').textContent = '70%';
  appState.currentPosition = 'center';
  document.querySelectorAll('#positionGrid .position-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.pos === 'center');
  });
  appState.currentWatermarkType = 'text';
  document.querySelectorAll('.watermark-type-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.type === 'text');
  });
  document.getElementById('textWatermarkSettings').style.display = 'block';
  document.getElementById('imageWatermarkSettings').style.display = 'none';
  appState.currentResizeMode = 'dimensions';
  document.querySelectorAll('.resize-mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === 'dimensions');
  });
  document.getElementById('dimensionsMode').style.display = 'block';
  document.getElementById('percentageMode').style.display = 'none';
  document.getElementById('resizeWidth').value = DEFAULT_WIDTH;
  document.getElementById('resizeHeight').value = DEFAULT_HEIGHT;
  document.getElementById('resizePercentage').value = 100;
  document.getElementById('percentageValue').textContent = '100%';
  document.getElementById('constrainProportions').checked = true;
  appState.constrainProportions = true;
  document.getElementById('resizeQuality').value = 'medium';
  const pattern = document.getElementById('outputFilenamePattern');
  if (pattern) pattern.value = '{basename}_watermarked';
  appState.watermarkImage = null;
  document.getElementById('watermarkImageInput').value = '';
  persistSettingsNow();
  logger.success('Settings reset to defaults');
}

export function persistSettingsDebounced() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persistSettingsNow, 400);
}

export function persistSettingsNow() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(collectSettings()));
  } catch (e) {
    logger.warning(`Could not save settings: ${e.message}`);
  }
}

export function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return false;
    applySettings(JSON.parse(raw), { logSuccess: false });
    logger.log('Restored settings from local storage');
    return true;
  } catch (e) {
    logger.warning('Stored settings invalid; using defaults');
    return false;
  }
}

export async function importSettingsFromFile(file) {
  const text = await file.text();
  const settings = JSON.parse(text);
  applySettings(settings);
  persistSettingsNow();
}
