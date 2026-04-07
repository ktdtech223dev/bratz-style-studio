/**
 * Defines the 20-layer z-order for the dress-up paper doll renderer.
 * Index 0 = furthest back, index 19 = furthest front.
 */
export const LAYER_ORDER = [
  'shadow',             // 0  - drop shadow beneath the character
  'legs',               // 1  - legs / lower body base
  'feet-base',          // 2  - bare feet
  'socks-tights-layer', // 3  - socks, tights, stockings
  'shoes-layer',        // 4  - shoes, boots, sandals
  'bottoms-layer',      // 5  - skirts, pants, shorts
  'body-torso',         // 6  - torso / upper body base
  'tops-layer',         // 7  - shirts, blouses, crop tops
  'outerwear-layer',    // 8  - jackets, coats, vests
  'neck-layer',         // 9  - necklaces, scarves, chokers
  'arms',               // 10 - arms base
  'wrist-layer',        // 11 - bracelets, watches, gloves
  'bag-layer',          // 12 - handbags, purses, backpacks
  'head-base',          // 13 - head / face base
  'face-features',      // 14 - eyes, nose, mouth
  'makeup-layer',       // 15 - makeup overlays
  'ear-layer',          // 16 - earrings, ear cuffs
  'hair-back-layer',    // 17 - back portion of hair (behind headwear)
  'headwear-layer',     // 18 - hats, headbands, crowns
  'hair-front-layer',   // 19 - front portion of hair (bangs, framing)
];

/** Map from slot name to its z-index for quick lookups */
const layerIndexMap = new Map(
  LAYER_ORDER.map((slot, index) => [slot, index])
);

/**
 * Returns the z-index value for a given slot name.
 * Slots not in the layer order return -1.
 *
 * @param {string} slot - The layer slot name (e.g. 'tops-layer')
 * @returns {number} The z-index (0-19), or -1 if not found
 */
export function getLayerIndex(slot) {
  if (!slot) return -1;
  return layerIndexMap.get(slot) ?? -1;
}

/**
 * Returns the total number of layers.
 * @returns {number}
 */
export function getLayerCount() {
  return LAYER_ORDER.length;
}

/**
 * Returns true if the given slot name is a valid layer.
 * @param {string} slot
 * @returns {boolean}
 */
export function isValidLayer(slot) {
  return layerIndexMap.has(slot);
}

/**
 * Returns only the equippable clothing/accessory layers
 * (excludes body base layers like shadow, legs, arms, etc.).
 * @returns {string[]}
 */
export function getEquippableLayers() {
  const baseLayers = new Set([
    'shadow', 'legs', 'feet-base', 'body-torso', 'arms',
    'head-base', 'face-features',
  ]);
  return LAYER_ORDER.filter((slot) => !baseLayers.has(slot));
}

/**
 * Sorts an array of items by their layer z-index (back to front).
 * Items without a recognized slot are placed at the end.
 *
 * @param {Array<{slot: string}>} items
 * @returns {Array<{slot: string}>}
 */
export function sortByLayerOrder(items) {
  return [...items].sort((a, b) => {
    const ai = getLayerIndex(a.slot);
    const bi = getLayerIndex(b.slot);
    return ai - bi;
  });
}
