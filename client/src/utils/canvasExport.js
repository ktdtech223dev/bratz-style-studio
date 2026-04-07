/**
 * Canvas export utilities for capturing, downloading, and sharing
 * the dress-up doll as an image.
 *
 * Uses html2canvas for DOM-to-canvas conversion.
 */

/**
 * Captures a DOM element as a PNG data URL using html2canvas.
 *
 * @param {HTMLElement} element - The DOM element to capture (e.g. the doll container)
 * @param {object} [options] - Optional html2canvas configuration overrides
 * @returns {Promise<string>} PNG data URL of the captured element
 */
export async function exportCanvas(element, options = {}) {
  if (!element) {
    throw new Error('exportCanvas: No element provided');
  }

  // Dynamically import html2canvas to keep the initial bundle lean
  let html2canvas;
  try {
    const mod = await import('html2canvas');
    html2canvas = mod.default || mod;
  } catch {
    throw new Error(
      'html2canvas is required for image export. Install it with: npm install html2canvas'
    );
  }

  const canvas = await html2canvas(element, {
    backgroundColor: null, // transparent background
    useCORS: true,         // handle cross-origin images
    scale: 2,              // 2x resolution for crisp output
    logging: false,
    allowTaint: false,
    ...options,
  });

  return canvas.toDataURL('image/png');
}

/**
 * Triggers a browser download of an image from a data URL.
 *
 * @param {string} dataUrl - The image data URL (e.g. from exportCanvas)
 * @param {string} [filename='bratz-style-studio.png'] - The download filename
 */
export function downloadImage(dataUrl, filename = 'bratz-style-studio.png') {
  if (!dataUrl) {
    throw new Error('downloadImage: No data URL provided');
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Clean up after a brief delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Shares an image using the Web Share API (mobile/supported browsers).
 * Falls back to download if sharing is not supported.
 *
 * @param {string} dataUrl - The image data URL
 * @param {string} [title='My Bratz Style Studio Look'] - Share title
 * @param {string} [text='Check out my outfit!'] - Share description text
 * @returns {Promise<boolean>} true if shared successfully, false if fell back to download
 */
export async function shareImage(dataUrl, title = 'My Bratz Style Studio Look', text = 'Check out my outfit!') {
  if (!dataUrl) {
    throw new Error('shareImage: No data URL provided');
  }

  // Convert data URL to a File object for the share API
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], 'bratz-look.png', { type: 'image/png' });

  // Check for Web Share API with file support
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch (err) {
      // User cancelled or share failed — fall through to download
      if (err.name === 'AbortError') {
        return false; // User cancelled, don't download
      }
    }
  }

  // Fallback: try sharing without files (just text + title)
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      // Fall through to download
    }
  }

  // Final fallback: download the image
  downloadImage(dataUrl, 'bratz-look.png');
  return false;
}

/**
 * Converts a data URL string to a Blob.
 *
 * @param {string} dataUrl
 * @returns {Blob}
 */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mime });
}

/**
 * Copies the image to the clipboard (if supported).
 *
 * @param {string} dataUrl - The image data URL
 * @returns {Promise<boolean>} true if copied successfully
 */
export async function copyImageToClipboard(dataUrl) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }

  try {
    const blob = dataUrlToBlob(dataUrl);
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
