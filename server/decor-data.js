// server/decor-data.js
// Decoration + furniture catalog for the home-decorating sim. Default items
// (price 0) are owned from the start. `data` holds what the 3D house renders for
// each slot (gradient color pairs, or {color,style} objects for furniture).
const SLOTS = [
  { id: 'wallpaper', label: 'Walls' },
  { id: 'floor', label: 'Floors' },
  { id: 'sofa', label: 'Sofa' },
  { id: 'bed', label: 'Beds' },
  { id: 'coffeetable', label: 'Tables' },
  { id: 'lamp', label: 'Lamps' },
  { id: 'rug', label: 'Rugs' },
  { id: 'cat', label: 'Cat' },
  { id: 'collar', label: 'Cat collar' },
  { id: 'pot', label: 'Plant pot' },
  { id: 'gardenpot', label: 'Garden pots' },
];

const ITEMS = [
  // ── WALLPAPER (wall top→bottom) ──
  { id: 'wall_dusk', slot: 'wallpaper', name: 'Dusk', price: 0, swatch: '#2c2f63', data: { wall: ['#2c2f63', '#232a5c'] } },
  { id: 'wall_warmwhite', slot: 'wallpaper', name: 'Warm white', price: 30, swatch: '#e9e4d8', data: { wall: ['#e9e4d8', '#d8d2c4'] } },
  { id: 'wall_sage', slot: 'wallpaper', name: 'Sage', price: 40, swatch: '#9fb39a', data: { wall: ['#9fb39a', '#85997f'] } },
  { id: 'wall_greige', slot: 'wallpaper', name: 'Greige', price: 40, swatch: '#b8ad9e', data: { wall: ['#b8ad9e', '#9c9385'] } },
  { id: 'wall_blush', slot: 'wallpaper', name: 'Blush', price: 50, swatch: '#e7c4c9', data: { wall: ['#e7c4c9', '#d3a7ae'] } },
  { id: 'wall_skyblue', slot: 'wallpaper', name: 'Sky blue', price: 50, swatch: '#a9c7dd', data: { wall: ['#a9c7dd', '#8caec8'] } },
  { id: 'wall_terra', slot: 'wallpaper', name: 'Terracotta', price: 60, swatch: '#c47b5a', data: { wall: ['#c47b5a', '#a9603f'] } },
  { id: 'wall_forest', slot: 'wallpaper', name: 'Forest', price: 60, swatch: '#3f5e4a', data: { wall: ['#3f5e4a', '#2c4536'] } },
  { id: 'wall_charcoal', slot: 'wallpaper', name: 'Charcoal', price: 70, swatch: '#3a3d44', data: { wall: ['#3a3d44', '#2a2d33'] } },
  { id: 'wall_rose', slot: 'wallpaper', name: 'Rosewood', price: 60, swatch: '#4a2c4e', data: { wall: ['#4a2c4e', '#33223a'] } },

  // ── FLOOR (top→bottom) ──
  { id: 'floor_plum', slot: 'floor', name: 'Plum', price: 0, swatch: '#3a2f5e', data: { floor: ['#3a2f5e', '#2a2348'] } },
  { id: 'floor_oak', slot: 'floor', name: 'Light oak', price: 30, swatch: '#caa472', data: { floor: ['#caa472', '#a8824f'] } },
  { id: 'floor_walnut', slot: 'floor', name: 'Walnut', price: 40, swatch: '#6e4a32', data: { floor: ['#6e4a32', '#523523'] } },
  { id: 'floor_greywash', slot: 'floor', name: 'Grey wash', price: 40, swatch: '#8a8a92', data: { floor: ['#8a8a92', '#6c6c74'] } },
  { id: 'floor_marble', slot: 'floor', name: 'Marble', price: 70, swatch: '#d8d6e0', data: { floor: ['#d8d6e0', '#bcbac6'] } },
  { id: 'floor_terratile', slot: 'floor', name: 'Terra tile', price: 50, swatch: '#b06a4a', data: { floor: ['#b06a4a', '#8f5238'] } },
  { id: 'floor_ash', slot: 'floor', name: 'Ash', price: 30, swatch: '#3a3f55', data: { floor: ['#3a3f55', '#2a2e40'] } },

  // ── SOFA ({color, style}) ──
  { id: 'sofa_grey', slot: 'sofa', name: 'Cloud grey', price: 0, swatch: '#9aa0b0', data: { sofa: { color: '#9aa0b0', style: 'modern' } } },
  { id: 'sofa_navy', slot: 'sofa', name: 'Navy modern', price: 80, swatch: '#33405e', data: { sofa: { color: '#33405e', style: 'modern' } } },
  { id: 'sofa_blush', slot: 'sofa', name: 'Blush velvet', price: 100, swatch: '#dd9fb0', data: { sofa: { color: '#dd9fb0', style: 'classic' } } },
  { id: 'sofa_forest', slot: 'sofa', name: 'Forest velvet', price: 110, swatch: '#3c6450', data: { sofa: { color: '#3c6450', style: 'classic' } } },
  { id: 'sofa_camel', slot: 'sofa', name: 'Camel leather', price: 120, swatch: '#b6864f', data: { sofa: { color: '#b6864f', style: 'modern' } } },
  { id: 'sofa_cream', slot: 'sofa', name: 'Cream loveseat', price: 90, swatch: '#e6dcc6', data: { sofa: { color: '#e6dcc6', style: 'loveseat' } } },
  { id: 'sofa_plum', slot: 'sofa', name: 'Plum loveseat', price: 100, swatch: '#6a4a6e', data: { sofa: { color: '#6a4a6e', style: 'loveseat' } } },

  // ── BED ({color frame, sheets}) ──
  { id: 'bed_oak', slot: 'bed', name: 'Oak & white', price: 0, swatch: '#b58a55', data: { bed: { color: '#b58a55', sheets: '#efece2' } } },
  { id: 'bed_walnut', slot: 'bed', name: 'Walnut & grey', price: 80, swatch: '#5e4030', data: { bed: { color: '#5e4030', sheets: '#c9ccd6' } } },
  { id: 'bed_white', slot: 'bed', name: 'White & blush', price: 90, swatch: '#e8e6ea', data: { bed: { color: '#e8e6ea', sheets: '#f3cdd6' } } },
  { id: 'bed_black', slot: 'bed', name: 'Black & white', price: 100, swatch: '#2c2c33', data: { bed: { color: '#2c2c33', sheets: '#eceaf2' } } },
  { id: 'bed_rattan', slot: 'bed', name: 'Rattan & cream', price: 120, swatch: '#caa56e', data: { bed: { color: '#caa56e', sheets: '#ece3cf' } } },

  // ── TABLE (coffee/dining; {color, style}) ──
  { id: 'table_oak', slot: 'coffeetable', name: 'Oak', price: 0, swatch: '#b58a55', data: { table: { color: '#b58a55', style: 'modern' } } },
  { id: 'table_walnut', slot: 'coffeetable', name: 'Walnut', price: 40, swatch: '#5e4030', data: { table: { color: '#5e4030', style: 'classic' } } },
  { id: 'table_white', slot: 'coffeetable', name: 'White', price: 50, swatch: '#e8e6ea', data: { table: { color: '#e8e6ea', style: 'modern' } } },
  { id: 'table_black', slot: 'coffeetable', name: 'Black', price: 50, swatch: '#2c2c33', data: { table: { color: '#2c2c33', style: 'modern' } } },
  { id: 'table_marble', slot: 'coffeetable', name: 'Marble top', price: 90, swatch: '#d8d6e0', data: { table: { color: '#d8d6e0', style: 'classic' } } },

  // ── LAMP ({color}) ──
  { id: 'lamp_cream', slot: 'lamp', name: 'Cream', price: 0, swatch: '#fcd9a8', data: { lamp: { color: '#fcd9a8' } } },
  { id: 'lamp_brass', slot: 'lamp', name: 'Brass', price: 50, swatch: '#cb9b54', data: { lamp: { color: '#cb9b54' } } },
  { id: 'lamp_sage', slot: 'lamp', name: 'Sage', price: 40, swatch: '#9fb39a', data: { lamp: { color: '#9fb39a' } } },
  { id: 'lamp_black', slot: 'lamp', name: 'Black', price: 40, swatch: '#2c2c33', data: { lamp: { color: '#2c2c33' } } },

  // ── RUG ({color}) ──
  { id: 'rug_plum', slot: 'rug', name: 'Plum', price: 0, swatch: '#3a2f5e', data: { rug: { color: '#3a2f5e' } } },
  { id: 'rug_sand', slot: 'rug', name: 'Sand', price: 30, swatch: '#d8c39a', data: { rug: { color: '#d8c39a' } } },
  { id: 'rug_sage', slot: 'rug', name: 'Sage', price: 40, swatch: '#9fb39a', data: { rug: { color: '#9fb39a' } } },
  { id: 'rug_blush', slot: 'rug', name: 'Blush', price: 40, swatch: '#dd9fb0', data: { rug: { color: '#dd9fb0' } } },
  { id: 'rug_slate', slot: 'rug', name: 'Slate', price: 40, swatch: '#4a5260', data: { rug: { color: '#4a5260' } } },
  { id: 'rug_cream', slot: 'rug', name: 'Cream', price: 30, swatch: '#e6dcc6', data: { rug: { color: '#e6dcc6' } } },

  // ── CAT (body / face / eye) ──
  { id: 'cat_black', slot: 'cat', name: 'Midnight', price: 0, swatch: '#231d38', data: { body: '#1c1830', face: '#231d38', eye: '#c084fc' } },
  { id: 'cat_ginger', slot: 'cat', name: 'Ginger', price: 80, swatch: '#d98a4a', data: { body: '#c97a3a', face: '#d98a4a', eye: '#6bbf6b' } },
  { id: 'cat_grey', slot: 'cat', name: 'Smoke', price: 60, swatch: '#6b6896', data: { body: '#5b5886', face: '#6b6896', eye: '#fde047' } },
  { id: 'cat_white', slot: 'cat', name: 'Snow', price: 80, swatch: '#e8e6f5', data: { body: '#dcd8ee', face: '#e8e6f5', eye: '#7dd3fc' } },
  { id: 'cat_calico', slot: 'cat', name: 'Calico', price: 100, swatch: '#7a5a44', data: { body: '#3a2f2a', face: '#7a5a44', eye: '#9be89b' } },

  // ── CAT COLLAR ({color} | null) ──
  { id: 'collar_none', slot: 'collar', name: 'No collar', price: 0, swatch: '#2a2440', data: { collar: null } },
  { id: 'collar_pink', slot: 'collar', name: 'Pink', price: 30, swatch: '#ff6ba8', data: { collar: { color: '#ff6ba8' } } },
  { id: 'collar_red', slot: 'collar', name: 'Red', price: 30, swatch: '#e0584f', data: { collar: { color: '#e0584f' } } },
  { id: 'collar_blue', slot: 'collar', name: 'Blue', price: 30, swatch: '#5b8def', data: { collar: { color: '#5b8def' } } },
  { id: 'collar_gold', slot: 'collar', name: 'Gold', price: 60, swatch: '#e3b34a', data: { collar: { color: '#e3b34a' } } },
  { id: 'collar_green', slot: 'collar', name: 'Green', price: 30, swatch: '#6bbf6b', data: { collar: { color: '#6bbf6b' } } },

  // ── PLANT POT (room plant; top→bottom) ──
  { id: 'pot_pink', slot: 'pot', name: 'Blush', price: 0, swatch: '#ff9fc4', data: { pot: ['#ff9fc4', '#e76aa0'] } },
  { id: 'pot_teal', slot: 'pot', name: 'Teal', price: 30, swatch: '#67e8f9', data: { pot: ['#67e8f9', '#2bb3c9'] } },
  { id: 'pot_terra', slot: 'pot', name: 'Terracotta', price: 30, swatch: '#fdba74', data: { pot: ['#fdba74', '#e08a4a'] } },
  { id: 'pot_lav', slot: 'pot', name: 'Lavender', price: 40, swatch: '#c4b5fd', data: { pot: ['#c4b5fd', '#9b7ff0'] } },
  { id: 'pot_white', slot: 'pot', name: 'White', price: 30, swatch: '#e8e6ea', data: { pot: ['#e8e6ea', '#cbc8d4'] } },

  // ── GARDEN POTS (Mercury's garden; top→bottom) ──
  { id: 'gpot_terra', slot: 'gardenpot', name: 'Terracotta', price: 0, swatch: '#cf935f', data: { gardenpot: ['#cf935f', '#9c6238'] } },
  { id: 'gpot_white', slot: 'gardenpot', name: 'White stone', price: 30, swatch: '#e0ddd2', data: { gardenpot: ['#e0ddd2', '#bcb8aa'] } },
  { id: 'gpot_sage', slot: 'gardenpot', name: 'Sage', price: 40, swatch: '#9fb39a', data: { gardenpot: ['#9fb39a', '#7c9077'] } },
  { id: 'gpot_blue', slot: 'gardenpot', name: 'Glazed blue', price: 40, swatch: '#5b8def', data: { gardenpot: ['#5b8def', '#3f68b8'] } },
  { id: 'gpot_charcoal', slot: 'gardenpot', name: 'Charcoal', price: 40, swatch: '#3a3d44', data: { gardenpot: ['#3a3d44', '#26282e'] } },
];

const DEFAULTS = {
  wallpaper: 'wall_dusk',
  floor: 'floor_plum',
  sofa: 'sofa_grey',
  bed: 'bed_oak',
  coffeetable: 'table_oak',
  lamp: 'lamp_cream',
  rug: 'rug_plum',
  cat: 'cat_black',
  collar: 'collar_none',
  pot: 'pot_pink',
  gardenpot: 'gpot_terra',
};

function itemById(id) {
  return ITEMS.find((i) => i.id === id);
}

// Resolve an equipped row (from room_decor) into the data the 3D house renders.
function resolve(row) {
  const out = {};
  for (const s of SLOTS) {
    const id = (row && row[s.id]) || DEFAULTS[s.id];
    const item = itemById(id) || itemById(DEFAULTS[s.id]);
    if (item) Object.assign(out, item.data);
  }
  return out;
}

module.exports = { SLOTS, ITEMS, DEFAULTS, itemById, resolve };
