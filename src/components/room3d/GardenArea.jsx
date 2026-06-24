import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import Plant3D from './Plant3D';
import Hotspot from './Hotspot';

// Outdoor 3D garden bed that renders the couple's REAL garden plants live.
// Reads `garden` from the store (kept fresh by the bound 'garden:update' socket),
// so plants appear/grow in real time. Placed by the orchestrator just outside the
// house: <GardenArea position={[...]} potColors={[top,bottom]} />.
//
// Pure component — primitives only, no Canvas/lazy-load (it always lives inside
// the house's existing <Canvas>). Tapping the bed opens /garden via Hotspot,
// while individual plants stay visible.

const DEFAULT_POTS = ['#cf935f', '#9c6238'];

// Plant3D's pot bottom sits ~0.23 below the group origin, so lift each plant so
// the pot rests on the ground patch at y=0.
const PLANT_LIFT = 0.23;

// Tidy grid: fixed column count, rows grow with plant count. Matches house scale
// (a plant pot is ~0.46 wide; ~0.8 spacing keeps a little air between pots).
const COLS = 3;
const SPACING_X = 0.8;
const SPACING_Z = 0.8;

function gridLayout(count) {
  const cols = Math.min(COLS, Math.max(1, count));
  const rows = Math.ceil(count / cols);
  const out = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    // center each row (last row may be partial)
    const rowCount = Math.min(cols, count - r * cols);
    const x = (c - (rowCount - 1) / 2) * SPACING_X;
    const z = (r - (rows - 1) / 2) * SPACING_Z;
    out.push([x, z]);
  }
  return out;
}

// A simple low-poly empty terracotta pot used as a hint when the garden is empty.
function EmptyPot({ position, potColors }) {
  const top = potColors?.[0] || DEFAULT_POTS[0];
  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.26, 16]} />
        <meshStandardMaterial color={top} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.04, 16]} />
        <meshStandardMaterial color={top} roughness={0.45} />
      </mesh>
      {/* dark soil disc inside */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
        <meshStandardMaterial color="#3a2e22" roughness={1} />
      </mesh>
    </group>
  );
}

// Low white picket fence built from posts + two rails along one side.
function FenceSide({ length, sway }) {
  const postCount = Math.max(2, Math.round(length / 0.45) + 1);
  const posts = [];
  for (let i = 0; i < postCount; i++) {
    const x = -length / 2 + (i / (postCount - 1)) * length;
    posts.push(x);
  }
  return (
    <group>
      {posts.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.07, 0.36, 0.07]} />
            <meshStandardMaterial color="#eef0f5" roughness={0.7} />
          </mesh>
          {/* pointed cap */}
          <mesh position={[0, 0.39, 0]} castShadow>
            <coneGeometry args={[0.06, 0.08, 4]} />
            <meshStandardMaterial color="#eef0f5" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* two horizontal rails */}
      {[0.12, 0.27].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[length, 0.05, 0.04]} />
          <meshStandardMaterial color="#e3e6ee" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Decorative watering can from primitives.
function WateringCan({ position }) {
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {/* body */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 14]} />
        <meshStandardMaterial color="#6fbfe0" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* spout */}
      <mesh position={[0.18, 0.14, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.26, 10]} />
        <meshStandardMaterial color="#5aa9cc" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* rose head */}
      <mesh position={[0.28, 0.21, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.04, 12]} />
        <meshStandardMaterial color="#5aa9cc" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* handle arc */}
      <mesh position={[-0.04, 0.26, 0]} rotation={[0, 0, 0.2]} castShadow>
        <torusGeometry args={[0.09, 0.018, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#5aa9cc" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

// Tiny wooden bench from primitives.
function Bench({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* seat */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.05, 0.22]} />
        <meshStandardMaterial color="#9c6a3c" roughness={0.85} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.34, -0.09]} castShadow>
        <boxGeometry args={[0.6, 0.18, 0.04]} />
        <meshStandardMaterial color="#9c6a3c" roughness={0.85} />
      </mesh>
      {/* legs */}
      {[[-0.26, 0.08], [0.26, 0.08], [-0.26, -0.08], [0.26, -0.08]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.05]} />
          <meshStandardMaterial color="#7d5430" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function GardenArea({ position = [0, 0, 0], potColors }) {
  const garden = useStore((s) => s.garden);
  const pots = potColors || DEFAULT_POTS;

  const plants = Array.isArray(garden) ? garden : [];
  const layout = useMemo(() => gridLayout(plants.length), [plants.length]);

  // Bed sizing scales a little with how many plants there are, with a cozy floor.
  const cols = Math.min(COLS, Math.max(1, plants.length || 1));
  const rows = Math.max(1, Math.ceil((plants.length || 2) / cols));
  const bedW = Math.max(1.8, cols * SPACING_X + 0.7);
  const bedD = Math.max(1.6, rows * SPACING_Z + 0.7);

  // stepping stones along the front edge
  const stones = useMemo(() => {
    const out = [];
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.5;
      out.push([x, bedD / 2 + 0.45 + (i % 2) * 0.05]);
    }
    return out;
  }, [bedD]);

  return (
    <group position={position}>
      {/* soft ambient + a gentle warm sun fill just for the garden */}
      <ambientLight intensity={0.35} color="#bfe6c0" />
      <pointLight position={[0, 3, 1.5]} intensity={0.4} color="#fff2cf" distance={9} decay={2} />

      <Hotspot to="/garden" label="Garden" glow="#9be89b">
        {/* grass patch */}
        <mesh position={[0, 0.01, 0]} receiveShadow>
          <boxGeometry args={[bedW, 0.04, bedD]} />
          <meshStandardMaterial color="#4f9e54" roughness={1} />
        </mesh>
        {/* soil border just under the grass for a planted look */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[bedW + 0.16, 0.1, bedD + 0.16]} />
          <meshStandardMaterial color="#5a4632" roughness={1} />
        </mesh>

        {/* stone border ring around the bed (low blocks) */}
        {(() => {
          const border = [];
          const ringW = bedW + 0.18;
          const ringD = bedD + 0.18;
          const along = (len, axis, edge) => {
            const n = Math.max(2, Math.round(len / 0.34));
            for (let i = 0; i < n; i++) {
              const t = -len / 2 + (i + 0.5) * (len / n);
              const pos = axis === 'x' ? [t, 0.05, edge] : [edge, 0.05, t];
              border.push(
                <mesh key={`${axis}${edge}${i}`} position={pos} castShadow receiveShadow>
                  <boxGeometry args={[0.18, 0.12, 0.18]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? '#9aa1a8' : '#b4bac0'}
                    roughness={0.95}
                  />
                </mesh>
              );
            }
          };
          along(ringW, 'x', ringD / 2);
          along(ringW, 'x', -ringD / 2);
          along(ringD, 'z', ringW / 2);
          along(ringD, 'z', -ringW / 2);
          return border;
        })()}

        {/* low picket fence behind the bed */}
        <group position={[0, 0, -bedD / 2 - 0.16]}>
          <FenceSide length={bedW + 0.3} />
        </group>

        {/* live plants — one per real garden entry, in a tidy grid */}
        {plants.length > 0 ? (
          plants.map((p, i) => {
            const [x, z] = layout[i] || [0, 0];
            return (
              <Plant3D
                key={p.id ?? i}
                position={[x, PLANT_LIFT, z]}
                stage={p.stage ?? 2}
                species={p.species}
                potColors={pots}
              />
            );
          })
        ) : (
          // empty-garden hint: a couple of empty pots
          <>
            <EmptyPot position={[-0.45, 0, 0]} potColors={pots} />
            <EmptyPot position={[0.45, 0, 0]} potColors={pots} />
          </>
        )}

        {/* decorative touches */}
        {stones.map(([x, z], i) => (
          <mesh key={`stone${i}`} position={[x, 0.02, z]} rotation={[0, i * 0.5, 0]} receiveShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.05, 12]} />
            <meshStandardMaterial color="#a9adb3" roughness={0.95} />
          </mesh>
        ))}

        <Bench position={[bedW / 2 + 0.45, 0, -bedD / 4]} rotation={[0, -Math.PI / 2, 0]} />
        <WateringCan position={[-bedW / 2 - 0.3, 0, bedD / 4]} />
      </Hotspot>
    </group>
  );
}
