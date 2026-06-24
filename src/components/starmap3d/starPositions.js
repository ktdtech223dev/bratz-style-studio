// Shared geometry helpers for the 3D star dome.
//
// Saved stars store x,y as ~0..100 percentages (the legacy 2D sky used them as
// left%/top%). We map them onto the inside of a sky dome so every memory keeps
// a stable spot:
//   x (0..100)  -> azimuth   (full 360° around the horizon)
//   y (0..100)  -> elevation (0% = high overhead, 100% = down near the horizon)
//
// The camera sits at the dome's centre looking out, so positions live on a
// sphere of DOME_R radius.

export const DOME_R = 9;

// Clamp elevation so stars never sit exactly at the pole (degenerate) or below
// the horizon line.
const EL_TOP = Math.PI * 0.46; // near straight up
const EL_BOT = Math.PI * 0.05; // just above the horizon

export function starToVec3(x, y, radius = DOME_R) {
  const nx = (Number(x) || 0) / 100;
  const ny = (Number(y) || 0) / 100;

  const azimuth = nx * Math.PI * 2;
  // y=0 (top of old 2D sky) -> high elevation; y=100 -> near horizon
  const elevation = EL_TOP - ny * (EL_TOP - EL_BOT);

  const cosEl = Math.cos(elevation);
  return [
    radius * cosEl * Math.cos(azimuth),
    radius * Math.sin(elevation),
    radius * cosEl * Math.sin(azimuth),
  ];
}

// Deterministic faint background stars scattered over the whole inner sphere so
// the dome never looks empty. Seeded so they don't jump between renders.
export function backgroundStars(count = 220, radius = DOME_R - 0.25) {
  const pts = [];
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const u = rnd();
    const v = rnd();
    const theta = u * Math.PI * 2;
    // bias toward the upper hemisphere so the "floor" stays dark
    const phi = Math.acos(1 - v * 1.35 - 0.0);
    const r = radius;
    pts.push([
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi)) * 0.96, // keep most above horizon
      r * Math.sin(phi) * Math.sin(theta),
      0.4 + rnd() * 0.5, // brightness
    ]);
  }
  return pts;
}
