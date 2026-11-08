export const appState = {
  uploadedFiles: [],
  processedImages: [],
  activeObjectURLs: [],
  removalMode: false,
  currentPreviewFilter: 'all',
  watermarkImage: null,
  currentWatermarkType: 'text',
  currentResizeMode: 'dimensions',
  currentPosition: 'center',
  constrainProportions: true,
  processingStatus: 'idle',
};

export function revokeAllObjectURLs() {
  appState.activeObjectURLs.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* empty */
    }
  });
  appState.activeObjectURLs = [];
}
