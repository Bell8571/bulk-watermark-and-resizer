/**
 * Load image with EXIF orientation correction when supported.
 * @returns {Promise<{ drawable: ImageBitmap|HTMLImageElement, width: number, height: number }>}
 */
export async function loadOrientedImageFromFile(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { drawable: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      /* fall through */
    }
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to decode ${file.name}`));
    image.src = dataUrl;
  });

  return { drawable: img, width: img.width, height: img.height };
}

export async function loadOrientedImageFromDataUrl(dataUrl) {
  if (typeof createImageBitmap === 'function' && typeof fetch === 'function') {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return { drawable: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      /* fall through */
    }
  }

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode image'));
    image.src = dataUrl;
  });
  return { drawable: img, width: img.width, height: img.height };
}

export function releaseDrawable(drawable) {
  if (drawable && typeof drawable.close === 'function') {
    drawable.close();
  }
}
