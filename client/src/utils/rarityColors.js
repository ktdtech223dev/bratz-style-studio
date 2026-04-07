/**
 * Rarity color definitions and utilities for the Bratz Style Studio gacha system.
 */

/** Solid color per rarity tier */
export const RARITY_COLORS = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ffd700',
};

/** Box-shadow glow effects per rarity tier */
export const RARITY_GLOWS = {
  common: '0 0 8px rgba(158,158,158,0.5)',
  rare: '0 0 12px rgba(33,150,243,0.7)',
  epic: '0 0 16px rgba(156,39,176,0.8)',
  legendary: '0 0 24px rgba(255,215,0,0.9), 0 0 48px rgba(255,105,180,0.5)',
};

/** Star count per rarity tier (for UI display) */
export const RARITY_STARS = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** Gradient backgrounds per rarity for card displays */
export const RARITY_GRADIENTS = {
  common: 'linear-gradient(135deg, #bdbdbd 0%, #e0e0e0 50%, #bdbdbd 100%)',
  rare: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 50%, #1565c0 100%)',
  epic: 'linear-gradient(135deg, #6a1b9a 0%, #ce93d8 50%, #6a1b9a 100%)',
  legendary: 'linear-gradient(135deg, #ff6f00 0%, #ffd740 30%, #fff176 50%, #ffd740 70%, #ff6f00 100%)',
};

/**
 * Returns a human-readable label for a rarity tier.
 *
 * @param {string} rarity - One of: common, rare, epic, legendary
 * @returns {string} Capitalized label (e.g. "Legendary")
 */
export function getRarityLabel(rarity) {
  if (!rarity) return 'Unknown';
  const labels = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };
  return labels[rarity.toLowerCase()] || rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Returns a CSS class name string for rarity-based background styling.
 * Intended for use with a corresponding CSS module or utility classes.
 *
 * @param {string} rarity - One of: common, rare, epic, legendary
 * @returns {string} CSS class name (e.g. "rarity-bg-legendary")
 */
export function getRarityBgClass(rarity) {
  if (!rarity) return 'rarity-bg-common';
  const normalized = rarity.toLowerCase();
  if (RARITY_COLORS[normalized]) {
    return `rarity-bg-${normalized}`;
  }
  return 'rarity-bg-common';
}

/**
 * Returns inline style object for a rarity-colored element.
 *
 * @param {string} rarity
 * @returns {{ color: string, boxShadow: string, background: string }}
 */
export function getRarityStyle(rarity) {
  const key = (rarity || 'common').toLowerCase();
  return {
    color: RARITY_COLORS[key] || RARITY_COLORS.common,
    boxShadow: RARITY_GLOWS[key] || RARITY_GLOWS.common,
    background: RARITY_GRADIENTS[key] || RARITY_GRADIENTS.common,
  };
}

/**
 * Returns a string of star characters for display.
 *
 * @param {string} rarity
 * @returns {string} e.g. "★★★" for epic
 */
export function getRarityStarsDisplay(rarity) {
  const count = RARITY_STARS[(rarity || 'common').toLowerCase()] || 1;
  return '★'.repeat(count);
}

/**
 * Returns the border color with alpha for card borders.
 *
 * @param {string} rarity
 * @param {number} [alpha=0.6]
 * @returns {string} CSS color string
 */
export function getRarityBorderColor(rarity, alpha = 0.6) {
  const hex = RARITY_COLORS[(rarity || 'common').toLowerCase()] || RARITY_COLORS.common;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
