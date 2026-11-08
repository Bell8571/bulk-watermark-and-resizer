import '@fortawesome/fontawesome-free/css/all.min.css';
import { initSecurity } from './security.js';
import { logger } from './logger.js';
import { appState } from './state.js';
import { APP_VERSION, PRODUCT_NAME } from './constants.js';
import {
  exportSettingsToFile,
  importSettingsFromFile,
  loadSettingsFromStorage,
  persistSettingsDebounced,
  persistSettingsNow,
  resetSettingsToDefaults,
} from './settings.js';
import { updateLivePreview, updatePreview } from './preview.js';
import { handleFiles, processAllImages, setPreset } from './processing.js';
import { downloadAsZip } from './download.js';

initSecurity();

window.setPreset = setPreset;

function setupDebugPanel() {
  const debugCard = document.getElementById('debugCard');
  const debugDetails = document.getElementById('debugDetails');
  if (import.meta.env.PROD) {
    debugCard?.classList.add('is-prod');
    debugDetails?.addEventListener('toggle', () => {
      if (debugDetails.open) debugCard?.classList.add('debug-expanded');
      else debugCard?.classList.remove('debug-expanded');
    });
  } else {
    debugCard?.classList.add('debug-expanded');
    if (debugDetails) debugDetails.open = true;
  }
}

function bindPersistOnChange(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', persistSettingsDebounced);
    el.addEventListener('input', persistSettingsDebounced);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const footer = document.getElementById('appVersionFooter');
  if (footer) footer.textContent = `${PRODUCT_NAME} ${APP_VERSION}`;

  setupDebugPanel();
  loadSettingsFromStorage();

  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const processBtn = document.getElementById('processBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
    dropArea.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  ['dragenter', 'dragover'].forEach((evt) => {
    dropArea.addEventListener(evt, () => {
      dropArea.style.borderColor = '#fff';
      dropArea.style.backgroundColor = 'rgba(255,255,255,0.15)';
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropArea.addEventListener(evt, () => {
      dropArea.style.borderColor = 'rgba(255,255,255,0.6)';
      dropArea.style.backgroundColor = '';
    });
  });
  dropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

  document.querySelectorAll('.resize-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.resize-mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentResizeMode = btn.dataset.mode;
      document.getElementById('dimensionsMode').style.display =
        appState.currentResizeMode === 'dimensions' ? 'block' : 'none';
      document.getElementById('percentageMode').style.display =
        appState.currentResizeMode === 'percentage' ? 'block' : 'none';
      updateLivePreview();
      persistSettingsDebounced();
    });
  });

  const percentageSlider = document.getElementById('resizePercentage');
  const percentageValue = document.getElementById('percentageValue');
  percentageSlider.addEventListener('input', () => {
    percentageValue.textContent = `${percentageSlider.value}%`;
    updateLivePreview();
    persistSettingsDebounced();
  });

  document.getElementById('constrainProportions').addEventListener('change', (e) => {
    appState.constrainProportions = e.target.checked;
    persistSettingsDebounced();
  });

  document.querySelectorAll('.watermark-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.watermark-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentWatermarkType = btn.dataset.type;
      document.getElementById('textWatermarkSettings').style.display =
        appState.currentWatermarkType === 'text' ? 'block' : 'none';
      document.getElementById('imageWatermarkSettings').style.display =
        appState.currentWatermarkType === 'image' ? 'block' : 'none';
      updateLivePreview();
      persistSettingsDebounced();
    });
  });

  document.getElementById('watermarkImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        appState.watermarkImage = img;
        updateLivePreview();
        logger.success('Logo loaded for watermark');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('#positionGrid .position-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#positionGrid .position-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentPosition = btn.dataset.pos;
      updateLivePreview();
      persistSettingsDebounced();
    });
  });

  ['watermarkText', 'watermarkFont', 'watermarkColor', 'watermarkOpacity', 'watermarkImageScale'].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateLivePreview);
    },
  );

  ['resizeWidth', 'resizeHeight'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateLivePreview);
  });

  document.getElementById('resizeQuality').addEventListener('change', () => {
    updateLivePreview();
    persistSettingsDebounced();
  });

  document.querySelectorAll('.preset-dimension').forEach((btn) => {
    btn.addEventListener('click', () => {
      setPreset(parseInt(btn.dataset.presetW, 10), parseInt(btn.dataset.presetH, 10));
    });
  });

  processBtn.addEventListener('click', processAllImages);
  downloadBtn.addEventListener('click', downloadAsZip);

  document.querySelectorAll('.preview-filter[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-filter[data-filter]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentPreviewFilter = btn.dataset.filter;
      updatePreview();
    });
  });

  document.getElementById('toggleRemoveMode').addEventListener('click', () => {
    appState.removalMode = !appState.removalMode;
    document.getElementById('toggleRemoveMode').innerHTML = appState.removalMode
      ? '<i class="fas fa-trash"></i> Remove Mode (ON)'
      : '<i class="fas fa-trash"></i> Remove Mode (OFF)';
    updatePreview();
  });

  document.getElementById('clearDebugBtn').addEventListener('click', () => logger.clear());

  document.getElementById('exportSettingsBtn').addEventListener('click', exportSettingsToFile);
  document.getElementById('importSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsInput').click();
  });
  document.getElementById('settingsInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importSettingsFromFile(file);
      updateLivePreview();
    } catch (err) {
      logger.error('Failed to import settings', err);
    }
    e.target.value = '';
  });

  document.getElementById('resetSettingsBtn').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults?')) return;
    resetSettingsToDefaults();
    updateLivePreview();
  });

  const opacitySlider = document.getElementById('watermarkOpacity');
  const opacityValue = document.getElementById('opacityValue');
  opacitySlider.addEventListener('input', () => {
    opacityValue.textContent = `${opacitySlider.value}%`;
  });

  document.querySelectorAll('.swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      document.getElementById('watermarkColor').value = swatch.dataset.color;
      updateLivePreview();
      persistSettingsDebounced();
    });
  });

  bindPersistOnChange([
    'watermarkText',
    'watermarkFont',
    'watermarkColor',
    'watermarkOpacity',
    'resizeWidth',
    'resizeHeight',
    'resizePercentage',
    'resizeQuality',
    'outputFilenamePattern',
  ]);

  window.addEventListener('beforeunload', () => {
    persistSettingsNow();
    if (window.ActiveObjectURLManager) window.ActiveObjectURLManager.revokeAll();
  });

  logger.success('ProPhoto Watermarker & Resizer initialized');
});
