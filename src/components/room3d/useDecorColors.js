import { useStore } from '../../store/useStore';

// Reads the live decor state (set from /api/state, updated by the 'decor:update'
// socket event) and resolves it into the colors/styles the 3D house needs, with
// safe fallbacks. server/decor-data.js resolve() returns a flat object:
//   { wall:[t,b], floor:[t,b], pot:[t,b], gardenpot:[t,b], body, face, eye,
//     sofa:{color,style}, bed:{color,sheets}, table:{color,style},
//     lamp:{color}, rug:{color}, collar:{color}|null }
// wall/floor/pot/gardenpot are [top,bottom] gradient pairs → callers use [0].
export default function useDecorColors() {
  const decor = useStore((s) => s.decor) || {};
  return {
    wall: decor.wall || ['#2c2f63', '#232a5c'],
    floor: decor.floor || ['#3a2f5e', '#2a2348'],
    pot: decor.pot || ['#ff9fc4', '#e76aa0'],
    gardenpot: decor.gardenpot || ['#cf935f', '#9c6238'],
    sofa: decor.sofa || { color: '#9aa0b0', style: 'modern' },
    bed: decor.bed || { color: '#b58a55', sheets: '#efece2' },
    table: decor.table || { color: '#b58a55', style: 'modern' },
    lamp: decor.lamp || { color: '#fcd9a8' },
    rug: decor.rug || { color: '#3a2f5e' },
    collar: decor.collar === undefined ? null : decor.collar, // {color} | null
    cat: {
      body: decor.body || '#1c1830',
      face: decor.face || '#231d38',
      eye: decor.eye || '#c084fc',
    },
  };
}
