import { useStore } from '../../store/useStore';

// Reads the live decor state (set from /api/state, updated by the 'decor:update'
// socket event) and resolves it into the colors the 3D room needs, with the
// exact fallbacks the old 2D SVG room used.
//
// server/decor-data.js resolve() returns:
//   { wall:[top,bot], floor:[top,bot], pot:[top,bot], body, face, eye }
// The old room mistakenly read decor.cat (which is UNDEFINED) — here we build
// the cat object from the flat body/face/eye fields instead.
//
// wall/floor/pot are [top,bottom] gradient pairs → callers use [0] (top) as the
// base material color.
export default function useDecorColors() {
  const decor = useStore((s) => s.decor) || {};
  return {
    wall: decor.wall || ['#2c2f63', '#232a5c'],
    floor: decor.floor || ['#3a2f5e', '#2a2348'],
    pot: decor.pot || ['#ff9fc4', '#e76aa0'],
    cat: {
      body: decor.body || '#1c1830',
      face: decor.face || '#231d38',
      eye: decor.eye || '#c084fc',
    },
  };
}
