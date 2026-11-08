import { appState } from './state.js';
import { isLightColor, sanitizeInput } from './validation.js';

export function applyWatermarkToCanvas(ctx, canvasWidth, canvasHeight) {
  const type = appState.currentWatermarkType;
  const opacity = parseInt(document.getElementById('watermarkOpacity').value, 10) / 100;
  const position = appState.currentPosition;

  ctx.save();
  ctx.globalAlpha = opacity;

  const padding = Math.min(canvasWidth, canvasHeight) * 0.04;

  let x;
  let y;
  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = canvasWidth / 2;
      y = padding;
      break;
    case 'top-right':
      x = canvasWidth - padding;
      y = padding;
      break;
    case 'middle-left':
      x = padding;
      y = canvasHeight / 2;
      break;
    case 'center':
      x = canvasWidth / 2;
      y = canvasHeight / 2;
      break;
    case 'middle-right':
      x = canvasWidth - padding;
      y = canvasHeight / 2;
      break;
    case 'bottom-left':
      x = padding;
      y = canvasHeight - padding;
      break;
    case 'bottom-center':
      x = canvasWidth / 2;
      y = canvasHeight - padding;
      break;
    case 'bottom-right':
      x = canvasWidth - padding;
      y = canvasHeight - padding;
      break;
    default:
      x = canvasWidth - padding;
      y = canvasHeight - padding;
  }

  if (type === 'text') {
    let text = document.getElementById('watermarkText').value || 'WATERMARK';
    text = sanitizeInput(text);
    if (text.length > 200) text = text.substring(0, 200);

    const font = document.getElementById('watermarkFont').value || 'Arial';
    const color = document.getElementById('watermarkColor').value || '#ffffff';
    const fontSize = Math.max(18, Math.floor(canvasWidth / 20));

    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.strokeStyle = isLightColor(color) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, fontSize / 16);

    ctx.textAlign = position.includes('right') ? 'right' : position.includes('center') ? 'center' : 'left';
    ctx.textBaseline =
      position.includes('bottom') ? 'bottom' : position.includes('middle') || position === 'center' ? 'middle' : 'top';

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  } else if (type === 'image' && appState.watermarkImage) {
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
}
