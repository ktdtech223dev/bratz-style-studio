/**
 * Generates inline SVG data URIs for clothing item previews.
 * Each category gets a distinct silhouette shape rendered in the item's color.
 */

const COLOR_MAP = {
  pink: '#FF69B4',
  black: '#1a1a2e',
  white: '#f0f0f0',
  red: '#DC143C',
  blue: '#4169E1',
  purple: '#9B59B6',
  green: '#2ECC71',
  gold: '#FFD700',
  silver: '#C0C0C0',
  orange: '#FF8C00',
  yellow: '#FFD700',
  brown: '#8B4513',
  beige: '#DEB887',
  denim: '#4682B4',
  multicolor: '#FF69B4',
  lavender: '#E6E6FA',
  coral: '#FF7F50',
  teal: '#008080',
  burgundy: '#800020',
  cream: '#FFFDD0',
};

function resolveColor(color) {
  if (!color) return '#FF69B4';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#FF69B4';
}

const SHAPES = {
  tops: (fill) => `
    <rect x="18" y="8" width="64" height="50" rx="8" fill="${fill}" opacity="0.9"/>
    <rect x="6" y="8" width="20" height="30" rx="6" fill="${fill}" opacity="0.7"/>
    <rect x="74" y="8" width="20" height="30" rx="6" fill="${fill}" opacity="0.7"/>
    <path d="M30 4 L50 0 L70 4 L70 12 L30 12 Z" fill="${fill}" opacity="0.8"/>
  `,
  bottoms: (fill) => `
    <path d="M20 5 L80 5 L82 15 L70 90 L55 90 L50 50 L45 90 L30 90 L18 15 Z" fill="${fill}" opacity="0.9"/>
    <rect x="20" y="5" width="60" height="12" rx="3" fill="${fill}" opacity="0.7"/>
  `,
  shoes: (fill) => `
    <path d="M15 50 L35 30 L45 30 L50 45 L85 45 L90 55 L85 65 L15 65 Z" fill="${fill}" opacity="0.9"/>
    <ellipse cx="50" cy="65" rx="38" ry="8" fill="${fill}" opacity="0.5"/>
    <rect x="35" y="28" width="12" height="20" rx="4" fill="${fill}" opacity="0.7"/>
  `,
  outerwear: (fill) => `
    <rect x="15" y="5" width="70" height="75" rx="6" fill="${fill}" opacity="0.85"/>
    <rect x="2" y="5" width="22" height="60" rx="6" fill="${fill}" opacity="0.65"/>
    <rect x="76" y="5" width="22" height="60" rx="6" fill="${fill}" opacity="0.65"/>
    <line x1="50" y1="5" x2="50" y2="80" stroke="${fill}" stroke-width="3" opacity="0.4"/>
    <path d="M35 5 L50 0 L65 5 L60 15 L40 15 Z" fill="${fill}" opacity="0.7"/>
  `,
  jewelry: (fill) => `
    <circle cx="50" cy="45" r="22" fill="none" stroke="${fill}" stroke-width="4" opacity="0.9"/>
    <circle cx="50" cy="23" r="10" fill="${fill}" opacity="0.9"/>
    <path d="M40 23 Q50 5 60 23" fill="none" stroke="${fill}" stroke-width="3" opacity="0.7"/>
    <circle cx="50" cy="67" r="5" fill="${fill}" opacity="0.6"/>
  `,
  bags: (fill) => `
    <rect x="20" y="25" width="60" height="55" rx="10" fill="${fill}" opacity="0.9"/>
    <path d="M30 25 Q30 8 50 8 Q70 8 70 25" fill="none" stroke="${fill}" stroke-width="5" opacity="0.7"/>
    <rect x="35" y="38" width="30" height="5" rx="2" fill="${fill}" opacity="0.5"/>
  `,
  makeup: (fill) => `
    <rect x="35" y="5" width="16" height="70" rx="8" fill="${fill}" opacity="0.9"/>
    <rect x="35" y="60" width="16" height="20" rx="4" fill="${fill}" opacity="0.6"/>
    <ellipse cx="43" cy="5" rx="8" ry="4" fill="${fill}" opacity="0.8"/>
    <circle cx="70" cy="55" r="18" fill="${fill}" opacity="0.5"/>
    <circle cx="70" cy="55" r="12" fill="${fill}" opacity="0.7"/>
  `,
  socks: (fill) => `
    <path d="M30 5 L30 60 Q30 80 50 80 L65 80 Q75 80 75 70 L75 55 Q75 45 65 45 L55 45 L55 5 Z" fill="${fill}" opacity="0.9"/>
    <rect x="30" y="5" width="25" height="8" rx="2" fill="${fill}" opacity="0.6"/>
  `,
  sets: (fill) => `
    <polygon points="50,5 61,35 95,35 67,55 78,85 50,67 22,85 33,55 5,35 39,35" fill="${fill}" opacity="0.9"/>
    <polygon points="50,20 56,38 75,38 60,48 65,66 50,55 35,66 40,48 25,38 44,38" fill="${fill}" opacity="0.5"/>
  `,
  headwear: (fill) => `
    <ellipse cx="50" cy="55" rx="40" ry="15" fill="${fill}" opacity="0.7"/>
    <path d="M20 55 Q20 15 50 10 Q80 15 80 55" fill="${fill}" opacity="0.9"/>
    <rect x="42" y="5" width="16" height="10" rx="4" fill="${fill}" opacity="0.6"/>
  `,
  earrings: (fill) => `
    <circle cx="50" cy="20" r="6" fill="${fill}" opacity="0.8"/>
    <line x1="50" y1="26" x2="50" y2="50" stroke="${fill}" stroke-width="2" opacity="0.7"/>
    <path d="M35 55 L50 85 L65 55 Z" fill="${fill}" opacity="0.9"/>
  `,
};

// Map categories to shape keys
const CATEGORY_SHAPE_MAP = {
  tops: 'tops',
  bottoms: 'bottoms',
  shoes: 'shoes',
  outerwear: 'outerwear',
  jewelry: 'jewelry',
  bags: 'bags',
  makeup: 'makeup',
  socks: 'socks',
  sets: 'sets',
  headwear: 'headwear',
  earrings: 'earrings',
  hair: 'sets',
};

/**
 * Generates an inline SVG data URI for a clothing item preview.
 *
 * @param {object} item - The clothing item { category, color, rarity }
 * @returns {string} Data URI string for use in img src
 */
export function getItemPreviewSvg(item) {
  if (!item) return '';

  const fill = resolveColor(item.color);
  const shapeKey = CATEGORY_SHAPE_MAP[item.category] || 'tops';
  const shapeFn = SHAPES[shapeKey] || SHAPES.tops;

  const rarityGlow = item.rarity === 'legendary'
    ? `<filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : item.rarity === 'epic'
    ? `<filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : '';

  const filterAttr = (item.rarity === 'legendary' || item.rarity === 'epic') ? ' filter="url(#glow)"' : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>${rarityGlow}</defs>
    <g${filterAttr}>${shapeFn(fill)}</g>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Returns a placeholder character body SVG data URI.
 *
 * @param {string} skinColor - Hex color for skin
 * @returns {string} Data URI
 */
export function getCharacterPreviewSvg(skinColor = '#F5CBA7') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" width="120" height="200">
    <ellipse cx="60" cy="38" rx="24" ry="28" fill="${skinColor}"/>
    <circle cx="50" cy="32" r="3" fill="#333"/>
    <circle cx="70" cy="32" r="3" fill="#333"/>
    <path d="M55 42 Q60 46 65 42" fill="none" stroke="#e8838f" stroke-width="2" stroke-linecap="round"/>
    <rect x="40" y="65" width="40" height="55" rx="12" fill="${skinColor}"/>
    <rect x="22" y="68" width="18" height="45" rx="8" fill="${skinColor}"/>
    <rect x="80" y="68" width="18" height="45" rx="8" fill="${skinColor}"/>
    <rect x="38" y="118" width="18" height="60" rx="7" fill="${skinColor}"/>
    <rect x="64" y="118" width="18" height="60" rx="7" fill="${skinColor}"/>
    <ellipse cx="47" cy="180" rx="12" ry="5" fill="${skinColor}"/>
    <ellipse cx="73" cy="180" rx="12" ry="5" fill="${skinColor}"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default getItemPreviewSvg;
