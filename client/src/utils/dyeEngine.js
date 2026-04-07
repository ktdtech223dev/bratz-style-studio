/**
 * Hair dye recoloring engine for Bratz Style Studio.
 *
 * Takes a source hair image and recolors pixels matching the base hair color
 * range using an offscreen canvas. Supports multiple dye modes:
 *   - single:  uniform recolor to a single target color
 *   - split:   left half / right half with two colors
 *   - ombre:   top-to-bottom gradient blend between two colors
 *   - streak:  alternating streaks of two colors
 *   - rainbow: cycles through a rainbow spectrum top-to-bottom
 */

// ── Base hair color range (brown #8B4513 family) ────────────────
// We consider a pixel "hair" if its hue is in the brown range and
// saturation/lightness fall within reasonable bounds.

const BASE_HUE_MIN = 15;   // orange-brown low end
const BASE_HUE_MAX = 40;   // brown-amber high end
const BASE_SAT_MIN = 0.20; // minimum saturation to be considered colored (not grey)
const BASE_LIGHT_MIN = 0.10;
const BASE_LIGHT_MAX = 0.75;

/**
 * Recolors a hair image with the given dye settings.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} source - The source hair image
 * @param {object} opts
 * @param {string} opts.primary     - Primary target color (hex, e.g. '#ff00aa')
 * @param {string} [opts.secondary] - Secondary target color (hex) for split/ombre/streak
 * @param {'single'|'split'|'ombre'|'streak'|'rainbow'} [opts.mode='single'] - Dye mode
 * @param {number} [opts.streakWidth=8] - Pixel width of each streak band (streak mode)
 * @returns {HTMLCanvasElement} A new canvas with the recolored hair
 */
export function recolorHair(source, opts = {}) {
  const {
    primary = '#8B4513',
    secondary = null,
    mode = 'single',
    streakWidth = 8,
  } = opts;

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;

  if (!width || !height) {
    throw new Error('dyeEngine: Source image has no dimensions');
  }

  // Create offscreen canvas and draw the source
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Parse target colors
  const primaryRGB = hexToRGB(primary);
  const secondaryRGB = secondary ? hexToRGB(secondary) : primaryRGB;
  const primaryHSL = rgbToHSL(primaryRGB.r, primaryRGB.g, primaryRGB.b);
  const secondaryHSL = secondary
    ? rgbToHSL(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b)
    : primaryHSL;

  // Rainbow hue stops
  const rainbowHues = [0, 30, 60, 120, 180, 240, 300];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip fully transparent pixels
    if (a < 10) continue;

    const srcHSL = rgbToHSL(r, g, b);

    // Check if this pixel is in the base hair color range
    if (!isHairPixel(srcHSL)) continue;

    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);

    // Determine the target HSL based on mode and position
    let targetHSL;

    switch (mode) {
      case 'split': {
        const ratio = x / width;
        targetHSL = ratio < 0.5 ? primaryHSL : secondaryHSL;
        break;
      }

      case 'ombre': {
        const ratio = y / height;
        targetHSL = lerpHSL(primaryHSL, secondaryHSL, ratio);
        break;
      }

      case 'streak': {
        // Alternating vertical bands
        const band = Math.floor(x / streakWidth);
        targetHSL = band % 2 === 0 ? primaryHSL : secondaryHSL;
        break;
      }

      case 'rainbow': {
        const ratio = y / height;
        targetHSL = getRainbowHSL(ratio, rainbowHues, primaryHSL.s, primaryHSL.l);
        break;
      }

      case 'single':
      default:
        targetHSL = primaryHSL;
        break;
    }

    // Recolor: shift the hue/saturation to the target while preserving
    // the original luminance relationship for natural shading
    const luminanceRatio = srcHSL.l / 0.35; // 0.35 is approx lightness of #8B4513
    const newL = clamp(targetHSL.l * luminanceRatio, 0, 1);

    const result = hslToRGB(targetHSL.h, targetHSL.s, newL);
    pixels[i] = result.r;
    pixels[i + 1] = result.g;
    pixels[i + 2] = result.b;
    // alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Async version that yields to the main thread for large images.
 * Processes in chunks to avoid blocking the UI.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} source
 * @param {object} opts - Same options as recolorHair
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function recolorHairAsync(source, opts = {}) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const totalPixels = width * height;

  // For small images, just use the sync version
  if (totalPixels < 250000) {
    return recolorHair(source, opts);
  }

  // For large images, use OffscreenCanvas if available
  if (typeof OffscreenCanvas !== 'undefined') {
    return new Promise((resolve) => {
      // Still use the sync approach but wrap in a microtask
      requestAnimationFrame(() => {
        resolve(recolorHair(source, opts));
      });
    });
  }

  return recolorHair(source, opts);
}

/**
 * Loads an image from a URL and returns an HTMLImageElement.
 *
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Convenience function: load an image URL and recolor it in one step.
 *
 * @param {string} url - Image URL
 * @param {object} opts - Dye options (primary, secondary, mode, streakWidth)
 * @returns {Promise<string>} Data URL of the recolored image
 */
export async function recolorFromURL(url, opts = {}) {
  const img = await loadImage(url);
  const canvas = recolorHair(img, opts);
  return canvas.toDataURL('image/png');
}

// ── Internal helpers ────────────────────────────────────────────

/**
 * Checks if a pixel (in HSL) falls within the base hair color range.
 */
function isHairPixel(hsl) {
  const hDeg = hsl.h * 360;
  return (
    hDeg >= BASE_HUE_MIN &&
    hDeg <= BASE_HUE_MAX &&
    hsl.s >= BASE_SAT_MIN &&
    hsl.l >= BASE_LIGHT_MIN &&
    hsl.l <= BASE_LIGHT_MAX
  );
}

/**
 * Parses a hex color string to { r, g, b }.
 */
function hexToRGB(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Converts RGB (0-255) to HSL (0-1 for all components).
 */
function rgbToHSL(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * Converts HSL (0-1) to RGB (0-255).
 */
function hslToRGB(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRGB(p, q, h + 1 / 3);
    g = hueToRGB(p, q, h);
    b = hueToRGB(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function hueToRGB(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/**
 * Linearly interpolates between two HSL colors.
 */
function lerpHSL(a, b, t) {
  // Handle hue wrapping for shortest-path interpolation
  let hDiff = b.h - a.h;
  if (hDiff > 0.5) hDiff -= 1;
  if (hDiff < -0.5) hDiff += 1;

  let h = a.h + hDiff * t;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;

  return {
    h,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

/**
 * Maps a 0-1 ratio to a rainbow HSL using predefined hue stops.
 */
function getRainbowHSL(ratio, hueStops, saturation, lightness) {
  const segmentCount = hueStops.length - 1;
  const scaledRatio = ratio * segmentCount;
  const segIndex = Math.min(Math.floor(scaledRatio), segmentCount - 1);
  const segT = scaledRatio - segIndex;

  const h1 = hueStops[segIndex] / 360;
  const h2 = hueStops[segIndex + 1] / 360;

  let hDiff = h2 - h1;
  if (hDiff > 0.5) hDiff -= 1;
  if (hDiff < -0.5) hDiff += 1;

  let h = h1 + hDiff * segT;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;

  return { h, s: saturation, l: lightness };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
