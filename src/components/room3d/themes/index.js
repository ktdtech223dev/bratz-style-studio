// Per-theme house floorplans. Pure data (no JSX) consumed by House.jsx.
// Convention matches the original house: origin-centered, +x right, +z front
// (south, where the garden is). Footprint ~7.4 x 5.4. Open dollhouse roof.
//
// Each fitting MUST include all 10 nav roles so no navigation is ever lost:
//   tv, speaker, frames, coffeetable, armchair, fireplace, fishtank, kitchen,
//   plant, telescope
// `at` is [x,y,z] (y≈0 for floor pieces; high for tv/frames/windows). `rot` is
// a Y-rotation in radians. furniture `kind`: sofa,bed,crib,dresser,nightstand,
// bookshelf,lamp,rug,dining,toybox.

const HX = 3.7;
const HZ = 2.7;
const P2 = Math.PI / 2;

// shared exterior walls with a south garden doorway (used by most plans)
function shell() {
  return [
    { a: [-HX, -HZ], b: [HX, -HZ] }, // back
    { a: [-HX, -HZ], b: [-HX, HZ] }, // west
    { a: [HX, -HZ], b: [HX, HZ] }, // east
    { a: [-HX, HZ], b: [-0.6, HZ] }, // south-left (garden door gap)
    { a: [0.6, HZ], b: [HX, HZ] }, // south-right
  ];
}

// ── MODERN: the original 3×2 grid (Our room | Living | Study / Baby | Kitchen | Sunroom) ──
const modern = {
  id: 'modern',
  exterior: 'modern',
  palette: { wall: '#43354f', trim: '#cdbfe6', roof: '#2a2a30', foundation: '#2a2a30' },
  bounds: { halfX: HX, halfZ: HZ, wallH: 2.0 },
  rooms: [
    { id: 'our', label: 'Our room', center: [-2.45, -1.35], size: [2.35, 2.5], floor: '#3a2f5e' },
    { id: 'living', label: 'Living', center: [0, -1.35], size: [2.35, 2.5], floor: '#43354f' },
    { id: 'study', label: 'Study', center: [2.45, -1.35], size: [2.35, 2.5], floor: '#2f3a4e' },
    { id: 'baby', label: 'Baby', center: [-2.45, 1.35], size: [2.35, 2.5], floor: '#4a4258' },
    { id: 'kitchen', label: 'Kitchen', center: [0, 1.35], size: [2.35, 2.5], floor: '#3c3340' },
    { id: 'sun', label: 'Sunroom', center: [2.45, 1.35], size: [2.35, 2.5], floor: '#34405a' },
  ],
  walls: [
    ...shell(),
    // column wall x=-1.25 (door gaps near z=-1.35 & 1.35)
    { a: [-1.25, -HZ], b: [-1.25, -1.85] }, { a: [-1.25, -0.85], b: [-1.25, 0.85] }, { a: [-1.25, 1.85], b: [-1.25, HZ] },
    { a: [1.25, -HZ], b: [1.25, -1.85] }, { a: [1.25, -0.85], b: [1.25, 0.85] }, { a: [1.25, 1.85], b: [1.25, HZ] },
    // row wall z=0 (door gaps at each column centre)
    { a: [-HX, 0], b: [-2.95, 0] }, { a: [-1.95, 0], b: [-0.5, 0] }, { a: [0.5, 0], b: [1.95, 0] }, { a: [2.95, 0], b: [HX, 0] },
  ],
  windows: [{ at: [-2.45, 1.35, -HZ + 0.07], rot: 0, moon: true }, { at: [2.45, 1.35, -HZ + 0.07], rot: 0, moon: false }],
  fittings: [
    { role: 'tv', at: [0, 1.3, -HZ + 0.16], rot: 0 },
    { role: 'speaker', at: [1.0, 0.3, -HZ + 0.35], rot: 0 },
    { role: 'frames', at: [0, 1.5, -HZ + 0.08], rot: 0 },
    { role: 'coffeetable', at: [0, 0, -1.2], rot: 0 },
    { role: 'armchair', at: [0.95, 0, -0.75], rot: -0.6 },
    { role: 'fireplace', at: [-1.09, 0, 1.35], rot: P2 },
    { role: 'fishtank', at: [HX - 0.5, 0, 0.95], rot: 0 },
    { role: 'kitchen', at: [0, 0, HZ - 0.4], rot: 0 },
    { role: 'plant', at: [1.75, 0, -0.85], rot: 0 },
    { role: 'telescope', at: [1.9, 0, HZ + 1.4], rot: 0 },
  ],
  furniture: [
    { kind: 'bed', at: [-2.45, 0, -1.9], rot: 0 },
    { kind: 'nightstand', at: [-3.35, 0, -2.05], rot: 0 },
    { kind: 'nightstand', at: [-1.55, 0, -2.05], rot: 0 },
    { kind: 'dresser', at: [-1.65, 0, -0.55], rot: -P2 },
    { kind: 'bookshelf', at: [3.15, 0, -2.5], rot: 0 },
    { kind: 'dresser', at: [2.55, 0, -0.55], rot: 0 },
    { kind: 'rug', at: [0, 0, -1.25], rot: 0 },
    { kind: 'sofa', at: [0, 0, -2.05], rot: 0 },
    { kind: 'lamp', at: [-1.0, 0, -0.65], rot: 0 },
    { kind: 'crib', at: [-2.75, 0, 0.85], rot: 0 },
    { kind: 'toybox', at: [-1.75, 0, 1.95], rot: 0 },
    { kind: 'dresser', at: [-1.7, 0, 0.65], rot: -P2 },
    { kind: 'rug', at: [-2.45, 0, 1.35], rot: 0 },
    { kind: 'dining', at: [0, 0, 1.05], rot: 0 },
    { kind: 'sofa', at: [2.45, 0, 1.85], rot: Math.PI },
    { kind: 'lamp', at: [3.25, 0, 0.55], rot: 0 },
  ],
  mood: [[-2.45, 1.55, -1.85]],
  avatars: [[-0.55, 0.5, 0.5], [0.55, -0.5, -0.5]],
  garden: [0, 0, HZ + 1.5],
};

// helper to build a theme from modern with overrides (keeps nav roles intact)
function variant(id, exterior, palette, over) {
  return { ...modern, id, exterior, palette: { ...modern.palette, ...palette }, ...over };
}

// ── FOREST CABIN: open-plan great room, one bedroom + loft study ──
const forest = variant(
  'forest',
  'forest',
  { wall: '#4a3a2c', trim: '#6b4f33', roof: '#2c3f2c', foundation: '#3a2c20' },
  {
    rooms: [
      { id: 'great', label: 'Great room', center: [0.6, -0.4], size: [5.4, 4.4], floor: '#5a4632' },
      { id: 'bed', label: 'Bedroom', center: [-2.5, -1.35], size: [2.3, 2.5], floor: '#4a3a2c' },
      { id: 'kitchen', label: 'Kitchen', center: [-2.5, 1.35], size: [2.3, 2.5], floor: '#4f3f30' },
    ],
    walls: [
      ...shell(),
      // one vertical wall separating the west rooms from the great room (door gaps)
      { a: [-1.35, -HZ], b: [-1.35, -1.9] }, { a: [-1.35, -0.8], b: [-1.35, 0.8] }, { a: [-1.35, 1.9], b: [-1.35, HZ] },
      // short divider between bedroom & kitchen (west side)
      { a: [-HX, 0], b: [-2.9, 0] }, { a: [-2.0, 0], b: [-1.35, 0] },
    ],
    windows: [{ at: [-2.5, 1.35, -HZ + 0.07], rot: 0, moon: true }, { at: [1.5, 1.4, -HZ + 0.07], rot: 0, moon: false }],
    fittings: [
      { role: 'tv', at: [1.6, 1.3, -HZ + 0.16], rot: 0 },
      { role: 'speaker', at: [2.7, 0.3, -HZ + 0.35], rot: 0 },
      { role: 'frames', at: [0.4, 1.5, -HZ + 0.08], rot: 0 },
      { role: 'coffeetable', at: [1.0, 0, -0.6], rot: 0 },
      { role: 'armchair', at: [2.2, 0, -0.2], rot: -0.8 },
      { role: 'fireplace', at: [HX - 0.16, 0, -1.2], rot: -P2 },
      { role: 'fishtank', at: [HX - 0.5, 0, 1.7], rot: 0 },
      { role: 'kitchen', at: [-2.5, 0, HZ - 0.4], rot: 0 },
      { role: 'plant', at: [-0.1, 0, 1.9], rot: 0 },
      { role: 'telescope', at: [1.9, 0, HZ + 1.4], rot: 0 },
    ],
    furniture: [
      { kind: 'bed', at: [-2.5, 0, -1.9], rot: 0 },
      { kind: 'nightstand', at: [-3.4, 0, -2.05], rot: 0 },
      { kind: 'dresser', at: [-1.7, 0, -0.6], rot: -P2 },
      { kind: 'sofa', at: [1.0, 0, -1.5], rot: 0 },
      { kind: 'rug', at: [1.2, 0, -0.6], rot: 0 },
      { kind: 'lamp', at: [-0.6, 0, -1.6], rot: 0 },
      { kind: 'dining', at: [-2.5, 0, 1.1], rot: 0 },
      { kind: 'bookshelf', at: [2.9, 0, 1.9], rot: Math.PI },
    ],
    mood: [[-2.5, 1.55, -1.85]],
  },
);

// ── TUSCAN MANSION: formal cross plan with wings ──
const tuscan = variant(
  'tuscan',
  'tuscan',
  { wall: '#5a4636', trim: '#d9c39a', roof: '#a8512f', foundation: '#7a5e3a' },
  {
    rooms: [
      { id: 'hall', label: 'Great hall', center: [0, -0.2], size: [2.6, 5.0], floor: '#6e5a40' },
      { id: 'master', label: 'Master', center: [-2.5, -1.35], size: [2.3, 2.5], floor: '#5a4636' },
      { id: 'library', label: 'Library', center: [2.5, -1.35], size: [2.3, 2.5], floor: '#4e3f30' },
      { id: 'atrium', label: 'Atrium', center: [-2.5, 1.35], size: [2.3, 2.5], floor: '#60502f' },
      { id: 'dining', label: 'Dining', center: [2.5, 1.35], size: [2.3, 2.5], floor: '#6a4f38' },
    ],
    walls: [
      ...shell(),
      { a: [-1.3, -HZ], b: [-1.3, -1.9] }, { a: [-1.3, -0.8], b: [-1.3, 0.8] }, { a: [-1.3, 1.9], b: [-1.3, HZ] },
      { a: [1.3, -HZ], b: [1.3, -1.9] }, { a: [1.3, -0.8], b: [1.3, 0.8] }, { a: [1.3, 1.9], b: [1.3, HZ] },
      { a: [-HX, 0], b: [-3.0, 0] }, { a: [-2.0, 0], b: [-1.3, 0] }, { a: [1.3, 0], b: [2.0, 0] }, { a: [3.0, 0], b: [HX, 0] },
    ],
    windows: [{ at: [-2.5, 1.4, -HZ + 0.07], rot: 0, moon: true }, { at: [2.5, 1.4, -HZ + 0.07], rot: 0, moon: false }],
    fittings: [
      { role: 'tv', at: [0, 1.3, -HZ + 0.16], rot: 0 },
      { role: 'speaker', at: [0.8, 0.3, -HZ + 0.35], rot: 0 },
      { role: 'frames', at: [0, 1.5, -HZ + 0.08], rot: 0 },
      { role: 'coffeetable', at: [0, 0, -0.6], rot: 0 },
      { role: 'armchair', at: [0.5, 0, 0.5], rot: Math.PI },
      { role: 'fireplace', at: [0, 0, -HZ + 0.18], rot: 0 },
      { role: 'fishtank', at: [-HX + 0.5, 0, 1.7], rot: 0 },
      { role: 'kitchen', at: [2.5, 0, HZ - 0.4], rot: 0 },
      { role: 'plant', at: [-2.5, 0, 1.7], rot: 0 },
      { role: 'telescope', at: [0, 0, HZ + 1.4], rot: 0 },
    ],
    furniture: [
      { kind: 'bed', at: [-2.5, 0, -1.9], rot: 0 },
      { kind: 'nightstand', at: [-3.4, 0, -2.05], rot: 0 },
      { kind: 'bookshelf', at: [3.2, 0, -2.5], rot: 0 },
      { kind: 'bookshelf', at: [1.9, 0, -2.5], rot: 0 },
      { kind: 'sofa', at: [0, 0, -1.4], rot: 0 },
      { kind: 'rug', at: [0, 0, -0.5], rot: 0 },
      { kind: 'dining', at: [2.5, 0, 1.2], rot: 0 },
      { kind: 'dresser', at: [-3.3, 0, 1.85], rot: P2 },
    ],
    mood: [[-2.5, 1.55, -1.85]],
  },
);

// ── BEACH HOUSE: long open coastal layout facing the ocean (back = -z) ──
const beach = variant(
  'beach',
  'beach',
  { wall: '#cdb189', trim: '#f0e6d2', roof: '#8aa3b0', foundation: '#cbb189' },
  {
    rooms: [
      { id: 'open', label: 'Open living', center: [0.5, -0.9], size: [5.4, 3.0], floor: '#d8c8a4' },
      { id: 'bed', label: 'Bedroom', center: [-2.5, 1.35], size: [2.3, 2.5], floor: '#cdb189' },
      { id: 'kitchen', label: 'Kitchen', center: [2.4, 1.35], size: [2.4, 2.5], floor: '#cfc0a0' },
    ],
    walls: [
      ...shell(),
      { a: [-HX, 0.6], b: [-2.9, 0.6] }, { a: [-2.0, 0.6], b: [1.3, 0.6] }, { a: [2.2, 0.6], b: [HX, 0.6] },
      { a: [-1.3, 0.6], b: [-1.3, HZ] }, { a: [1.3, 0.6], b: [1.3, HZ] },
    ],
    windows: [{ at: [-1.6, 1.4, -HZ + 0.07], rot: 0, moon: false }, { at: [1.6, 1.4, -HZ + 0.07], rot: 0, moon: false }],
    fittings: [
      { role: 'tv', at: [-1.4, 1.3, -HZ + 0.16], rot: 0 },
      { role: 'speaker', at: [-0.4, 0.3, -HZ + 0.35], rot: 0 },
      { role: 'frames', at: [1.4, 1.5, -HZ + 0.08], rot: 0 },
      { role: 'coffeetable', at: [-1.4, 0, -1.0], rot: 0 },
      { role: 'armchair', at: [1.6, 0, -0.6], rot: -0.5 },
      { role: 'fireplace', at: [HX - 0.16, 0, -1.6], rot: -P2 },
      { role: 'fishtank', at: [2.6, 0, -0.4], rot: 0 },
      { role: 'kitchen', at: [2.4, 0, HZ - 0.4], rot: 0 },
      { role: 'plant', at: [-2.9, 0, -0.5], rot: 0 },
      { role: 'telescope', at: [0, 0, HZ + 1.4], rot: 0 },
    ],
    furniture: [
      { kind: 'sofa', at: [-1.4, 0, -1.9], rot: 0 },
      { kind: 'rug', at: [-1.2, 0, -1.0], rot: 0 },
      { kind: 'bed', at: [-2.5, 0, 1.9], rot: Math.PI },
      { kind: 'nightstand', at: [-3.4, 0, 2.0], rot: 0 },
      { kind: 'dining', at: [2.4, 0, 1.3], rot: 0 },
      { kind: 'lamp', at: [0.2, 0, -1.8], rot: 0 },
    ],
    mood: [[-2.5, 1.55, 1.9]],
  },
);

// ── COZY COTTAGE: compact snug + reading nook ──
const cottage = variant(
  'cottage',
  'cottage',
  { wall: '#7a6a52', trim: '#b89b5e', roof: '#8a5a3a', foundation: '#9c5a48' },
  {
    rooms: [
      { id: 'snug', label: 'Snug', center: [-0.6, -1.35], size: [4.0, 2.5], floor: '#6e5a40' },
      { id: 'kitchen', label: 'Kitchen', center: [-2.5, 1.35], size: [2.3, 2.5], floor: '#5f5238' },
      { id: 'bed', label: 'Bedroom', center: [2.5, -1.35], size: [2.3, 2.5], floor: '#5a4a38' },
      { id: 'nook', label: 'Reading nook', center: [1.0, 1.35], size: [4.0, 2.5], floor: '#665540' },
    ],
    walls: [
      ...shell(),
      { a: [1.35, -HZ], b: [1.35, -1.9] }, { a: [1.35, -0.8], b: [1.35, 0.8] }, { a: [1.35, 1.9], b: [1.35, HZ] },
      { a: [-HX, 0], b: [-2.9, 0] }, { a: [-2.0, 0], b: [-0.7, 0] },
      { a: [-1.35, -HZ], b: [-1.35, 0] },
    ],
    windows: [{ at: [-0.6, 1.35, -HZ + 0.07], rot: 0, moon: true }, { at: [2.5, 1.35, -HZ + 0.07], rot: 0, moon: false }],
    fittings: [
      { role: 'tv', at: [-0.6, 1.3, -HZ + 0.16], rot: 0 },
      { role: 'speaker', at: [0.4, 0.3, -HZ + 0.35], rot: 0 },
      { role: 'frames', at: [-1.6, 1.5, -HZ + 0.08], rot: 0 },
      { role: 'coffeetable', at: [-0.6, 0, -1.3], rot: 0 },
      { role: 'armchair', at: [2.0, 0, 1.1], rot: Math.PI },
      { role: 'fireplace', at: [-0.6, 0, -HZ + 0.18], rot: 0 },
      { role: 'fishtank', at: [HX - 0.5, 0, 1.7], rot: 0 },
      { role: 'kitchen', at: [-2.5, 0, HZ - 0.4], rot: 0 },
      { role: 'plant', at: [-0.6, 0, 1.9], rot: 0 },
      { role: 'telescope', at: [1.9, 0, HZ + 1.4], rot: 0 },
    ],
    furniture: [
      { kind: 'sofa', at: [-0.6, 0, -2.0], rot: 0 },
      { kind: 'rug', at: [-0.6, 0, -1.3], rot: 0 },
      { kind: 'bed', at: [2.5, 0, -1.9], rot: 0 },
      { kind: 'nightstand', at: [3.4, 0, -2.05], rot: 0 },
      { kind: 'bookshelf', at: [-0.6, 0, 1.9], rot: Math.PI },
      { kind: 'dining', at: [-2.5, 0, 1.1], rot: 0 },
    ],
    mood: [[2.5, 1.55, -1.85]],
  },
);

// ── SNOWY CHALET: central hearth + sunken living ──
const chalet = variant(
  'chalet',
  'chalet',
  { wall: '#5a5550', trim: '#cdd6e6', roof: '#6a4a32', foundation: '#4a4640' },
  {
    rooms: [
      { id: 'living', label: 'Living', center: [0, -0.2], size: [2.8, 5.0], floor: '#4a4640' },
      { id: 'bunk', label: 'Bunk room', center: [-2.5, -1.35], size: [2.3, 2.5], floor: '#534a40' },
      { id: 'store', label: 'Study', center: [2.5, -1.35], size: [2.3, 2.5], floor: '#46504a' },
      { id: 'kitchen', label: 'Kitchen', center: [-2.5, 1.35], size: [2.3, 2.5], floor: '#4e463a' },
      { id: 'mud', label: 'Mudroom', center: [2.5, 1.35], size: [2.3, 2.5], floor: '#48443e' },
    ],
    walls: [
      ...shell(),
      { a: [-1.4, -HZ], b: [-1.4, -1.9] }, { a: [-1.4, -0.8], b: [-1.4, 0.8] }, { a: [-1.4, 1.9], b: [-1.4, HZ] },
      { a: [1.4, -HZ], b: [1.4, -1.9] }, { a: [1.4, -0.8], b: [1.4, 0.8] }, { a: [1.4, 1.9], b: [1.4, HZ] },
      { a: [-HX, 0], b: [-3.0, 0] }, { a: [-2.0, 0], b: [-1.4, 0] }, { a: [1.4, 0], b: [2.0, 0] }, { a: [3.0, 0], b: [HX, 0] },
    ],
    windows: [{ at: [-2.5, 1.4, -HZ + 0.07], rot: 0, moon: true }, { at: [2.5, 1.4, -HZ + 0.07], rot: 0, moon: false }],
    fittings: [
      { role: 'tv', at: [0, 1.3, -HZ + 0.16], rot: 0 },
      { role: 'speaker', at: [0.8, 0.3, -HZ + 0.35], rot: 0 },
      { role: 'frames', at: [0, 1.5, -HZ + 0.08], rot: 0 },
      { role: 'coffeetable', at: [0, 0, 0.2], rot: 0 },
      { role: 'armchair', at: [0.6, 0, 1.1], rot: Math.PI },
      { role: 'fireplace', at: [0, 0, -HZ + 0.18], rot: 0 },
      { role: 'fishtank', at: [HX - 0.5, 0, -1.6], rot: 0 },
      { role: 'kitchen', at: [-2.5, 0, HZ - 0.4], rot: 0 },
      { role: 'plant', at: [2.5, 0, 1.7], rot: 0 },
      { role: 'telescope', at: [0, 0, HZ + 1.4], rot: 0 },
    ],
    furniture: [
      { kind: 'bed', at: [-2.5, 0, -1.9], rot: 0 },
      { kind: 'nightstand', at: [-3.4, 0, -2.05], rot: 0 },
      { kind: 'bookshelf', at: [3.2, 0, -2.5], rot: 0 },
      { kind: 'sofa', at: [0, 0, -0.6], rot: 0 },
      { kind: 'rug', at: [0, 0, 0.3], rot: 0 },
      { kind: 'dining', at: [-2.5, 0, 1.1], rot: 0 },
      { kind: 'toybox', at: [2.5, 0, 1.9], rot: 0 },
    ],
    mood: [[-2.5, 1.55, -1.85]],
  },
);

export const THEMES = { modern, forest, tuscan, beach, cottage, chalet };

export function getFloorplan(id) {
  return THEMES[id] || THEMES.modern;
}
