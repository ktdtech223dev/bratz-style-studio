// server/decor-data.js
// Room decoration catalog. Default items (price 0) are owned from the start.
// `data` holds the colors RoomScene uses to render each slot.
const SLOTS = [
  { id: 'wallpaper', label: 'Wallpaper' },
  { id: 'floor', label: 'Floor' },
  { id: 'cat', label: 'Cat' },
  { id: 'pot', label: 'Plant pot' },
];

const ITEMS = [
  // ── WALLPAPER (wall top→bottom) ──
  { id: 'wall_dusk', slot: 'wallpaper', name: 'Dusk', price: 0, swatch: '#2c2f63', data: { wall: ['#2c2f63', '#232a5c'] } },
  { id: 'wall_rose', slot: 'wallpaper', name: 'Rosewood', price: 40, swatch: '#4a2c4e', data: { wall: ['#4a2c4e', '#33223a'] } },
  { id: 'wall_forest', slot: 'wallpaper', name: 'Forest', price: 40, swatch: '#21413a', data: { wall: ['#21413a', '#16291f'] } },
  { id: 'wall_ocean', slot: 'wallpaper', name: 'Deep ocean', price: 40, swatch: '#2a3a5c', data: { wall: ['#2a3a5c', '#1f2a44'] } },
  { id: 'wall_sunset', slot: 'wallpaper', name: 'Sunset', price: 60, swatch: '#5a3a4e', data: { wall: ['#5a3a4e', '#2a2348'] } },

  // ── FLOOR (floor top→bottom) ──
  { id: 'floor_plum', slot: 'floor', name: 'Plum', price: 0, swatch: '#3a2f5e', data: { floor: ['#3a2f5e', '#2a2348'] } },
  { id: 'floor_oak', slot: 'floor', name: 'Oak wood', price: 30, swatch: '#5e4630', data: { floor: ['#5e4630', '#3a2c20'] } },
  { id: 'floor_ash', slot: 'floor', name: 'Ash', price: 30, swatch: '#3a3f55', data: { floor: ['#3a3f55', '#2a2e40'] } },
  { id: 'floor_rose', slot: 'floor', name: 'Rosé', price: 40, swatch: '#5e3a4e', data: { floor: ['#5e3a4e', '#3a2434'] } },

  // ── CAT (body / face / eye) ──
  { id: 'cat_black', slot: 'cat', name: 'Midnight', price: 0, swatch: '#231d38', data: { body: '#1c1830', face: '#231d38', eye: '#c084fc' } },
  { id: 'cat_ginger', slot: 'cat', name: 'Ginger', price: 80, swatch: '#d98a4a', data: { body: '#c97a3a', face: '#d98a4a', eye: '#6bbf6b' } },
  { id: 'cat_grey', slot: 'cat', name: 'Smoke', price: 60, swatch: '#6b6896', data: { body: '#5b5886', face: '#6b6896', eye: '#fde047' } },
  { id: 'cat_white', slot: 'cat', name: 'Snow', price: 80, swatch: '#e8e6f5', data: { body: '#dcd8ee', face: '#e8e6f5', eye: '#7dd3fc' } },
  { id: 'cat_calico', slot: 'cat', name: 'Calico', price: 100, swatch: '#7a5a44', data: { body: '#3a2f2a', face: '#7a5a44', eye: '#9be89b' } },

  // ── PLANT POT (top→bottom) ──
  { id: 'pot_pink', slot: 'pot', name: 'Blush', price: 0, swatch: '#ff9fc4', data: { pot: ['#ff9fc4', '#e76aa0'] } },
  { id: 'pot_teal', slot: 'pot', name: 'Teal', price: 30, swatch: '#67e8f9', data: { pot: ['#67e8f9', '#2bb3c9'] } },
  { id: 'pot_terra', slot: 'pot', name: 'Terracotta', price: 30, swatch: '#fdba74', data: { pot: ['#fdba74', '#e08a4a'] } },
  { id: 'pot_lav', slot: 'pot', name: 'Lavender', price: 40, swatch: '#c4b5fd', data: { pot: ['#c4b5fd', '#9b7ff0'] } },
];

const DEFAULTS = { wallpaper: 'wall_dusk', floor: 'floor_plum', cat: 'cat_black', pot: 'pot_pink' };

function itemById(id) {
  return ITEMS.find((i) => i.id === id);
}

// Resolve an equipped row (from room_decor) into the color data RoomScene needs.
function resolve(row) {
  const out = {};
  for (const slot of ['wallpaper', 'floor', 'cat', 'pot']) {
    const id = (row && row[slot === 'wallpaper' ? 'wallpaper' : slot]) || DEFAULTS[slot];
    const item = itemById(id) || itemById(DEFAULTS[slot]);
    Object.assign(out, item.data);
  }
  return out;
}

module.exports = { SLOTS, ITEMS, DEFAULTS, itemById, resolve };
