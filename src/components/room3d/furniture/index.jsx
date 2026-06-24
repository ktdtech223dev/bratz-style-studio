// Furniture library — realistic, low-poly, color/style-parameterized R3F
// components built purely from primitives + drei RoundedBox. No store/decor
// imports; everything is driven by props so the caller owns placement and
// palette. Each export is a self-contained <group> that spreads `...props`
// onto its root (caller sets position/rotation/scale).
//
// Exports:
//   Sofa, CoffeeTableF, DiningSet            (Seating.jsx)
//   BedFrame, Crib, Dresser, NightStand,
//   Toybox                                   (Bedroom.jsx)
//   Bookshelf, FloorLamp, AreaRug, CatCollar (Decor.jsx)

export { Sofa, CoffeeTableF, DiningSet } from './Seating';
export { BedFrame, Crib, Dresser, NightStand, Toybox } from './Bedroom';
export { Bookshelf, FloorLamp, AreaRug, CatCollar } from './Decor';
