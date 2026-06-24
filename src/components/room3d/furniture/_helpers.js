// Shared color helpers for the furniture library. Pure functions — no imports
// from store/decor. Everything derives from the single `color` prop so callers
// stay in control of the palette.

import { Color } from 'three';

// Fixed neutrals used as the "second shade" for natural materials.
export const WOOD = '#5e4630';
export const WOOD_DARK = '#4a3726';
export const METAL = '#9aa3c8';

// Return a hex string that is the input color shifted in lightness.
// amount > 0 lightens, amount < 0 darkens. Clamped to [0,1].
export function shade(color, amount = 0) {
  const c = new Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + amount));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

// A clearly lighter tint and a clearly darker tone of a base color.
export const lighten = (color, amt = 0.14) => shade(color, amt);
export const darken = (color, amt = 0.14) => shade(color, -amt);

// Rotate the hue to get a tasteful complementary-ish accent that still reads as
// "the same family" (small hue nudge keeps things realistic, not garish).
export function nudgeHue(color, deg = 18, lAdjust = 0) {
  const c = new Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.h = (hsl.h + deg / 360 + 1) % 1;
  hsl.l = Math.max(0, Math.min(1, hsl.l + lAdjust));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

// A muted, slightly desaturated version (good for fabric/cushions).
export function muted(color, lAdjust = 0) {
  const c = new Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.s = Math.max(0, hsl.s * 0.7);
  hsl.l = Math.max(0, Math.min(1, hsl.l + lAdjust));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

// A lively set of book/toy colors — deterministic, derived from the base hue so
// they harmonize with the chosen color but still pop.
export function paletteFrom(color, n = 6) {
  const c = new Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = (hsl.h + i * 0.16) % 1;
    const s = Math.min(1, 0.55 + (i % 3) * 0.12);
    const l = 0.55 + (i % 2) * 0.08;
    const cc = new Color();
    cc.setHSL(h, s, l);
    out.push(`#${cc.getHexString()}`);
  }
  return out;
}
