import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// A reusable low-poly potted plant with botanically-recognizable geometry per
// species, built purely from primitives. Used in the room, the Plant page, and
// the garden (via GardenPlantSprite). API kept stable:
//   { stage 0..4, potColors:[top,bot], species, sway }
const GREEN = '#4f9a4f';
const GREEN2 = '#3d8b40';
const STEM = '#5a8a3a';
const TRUNK = '#6b4f33';

function Leaf({ position, rotation, scale = 1, color = GREEN }) {
  // a flattened blade
  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale * 0.18, scale * 0.5]} castShadow raycast={() => null}>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
}

// ── per-species foliage (s = 0..4 growth) ──
function Sunflower({ s }) {
  const h = 0.25 + s * 0.12;
  const petals = 12;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.02, 0.03, h, 6]} />
        <meshStandardMaterial color={STEM} roughness={0.8} />
      </mesh>
      {[-1, 1].map((d, i) => (
        <Leaf key={i} position={[d * 0.12, h * 0.45, 0]} rotation={[0, 0, d * 0.6]} scale={0.7 + s * 0.05} color={GREEN} />
      ))}
      {s >= 1 && (
        <group position={[0, h + 0.02, 0]} rotation={[Math.PI / 2.6, 0, 0]}>
          {/* petals */}
          {Array.from({ length: petals }).map((_, i) => {
            const a = (i / petals) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13]} rotation={[0, -a, 0]} castShadow raycast={() => null}>
                <boxGeometry args={[0.11, 0.02, 0.05]} />
                <meshStandardMaterial color="#fdc52e" roughness={0.6} />
              </mesh>
            );
          })}
          {/* brown center */}
          <mesh raycast={() => null}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
            <meshStandardMaterial color="#6b4a26" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Rose({ s }) {
  const blooms = 1 + s;
  return (
    <group>
      {/* bushy foliage */}
      {Array.from({ length: 3 + s }).map((_, i) => {
        const a = (i / (3 + s)) * Math.PI * 2 + i;
        const r = 0.06 + (i % 2) * 0.05;
        return <Leaf key={i} position={[Math.cos(a) * r, 0.12 + (i % 3) * 0.04, Math.sin(a) * r]} rotation={[0.3, a, 0]} scale={0.6 + s * 0.04} color={i % 2 ? GREEN : GREEN2} />;
      })}
      {/* layered red blooms */}
      {Array.from({ length: blooms }).map((_, i) => {
        const a = (i / blooms) * Math.PI * 2;
        const r = blooms === 1 ? 0 : 0.1 + s * 0.02;
        const y = 0.18 + s * 0.05;
        return (
          <group key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <mesh raycast={() => null}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshStandardMaterial color="#d23b5e" roughness={0.5} />
            </mesh>
            <mesh scale={0.7} position={[0, 0.02, 0]} raycast={() => null}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#e85b7a" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Monstera({ s }) {
  const leaves = 2 + s;
  return (
    <group>
      {Array.from({ length: leaves }).map((_, i) => {
        const a = (i / leaves) * Math.PI * 2 + 0.6;
        const lean = 0.5 + (i % 2) * 0.15;
        const len = 0.22 + s * 0.05;
        return (
          <group key={i} rotation={[0, a, 0]}>
            {/* stalk */}
            <mesh position={[0, (0.12 + s * 0.05) / 2, 0.06]} rotation={[lean * 0.4, 0, 0]} castShadow raycast={() => null}>
              <cylinderGeometry args={[0.012, 0.016, 0.14 + s * 0.05, 5]} />
              <meshStandardMaterial color={STEM} roughness={0.8} />
            </mesh>
            {/* big split leaf (flattened, notched look via two blades) */}
            <group position={[0, 0.16 + s * 0.05, 0.16 + s * 0.03]} rotation={[lean, 0, 0]}>
              {[-1, 1].map((d) => (
                <mesh key={d} position={[d * len * 0.32, 0, 0]} scale={[len * 0.55, 0.02, len]} castShadow raycast={() => null}>
                  <sphereGeometry args={[0.5, 8, 6]} />
                  <meshStandardMaterial color={d > 0 ? '#3f8b3f' : '#357835'} roughness={0.65} flatShading />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Cactus({ s }) {
  const h = 0.22 + s * 0.1;
  return (
    <group>
      <mesh position={[0, h / 2 + 0.02, 0]} castShadow raycast={() => null}>
        <capsuleGeometry args={[0.09 + s * 0.008, h, 6, 12]} />
        <meshStandardMaterial color="#5fa463" roughness={0.7} />
      </mesh>
      {s >= 2 &&
        [-1, 1].map((d, i) => (
          <group key={i} position={[d * (0.09 + s * 0.008), h * 0.5, 0]}>
            <mesh position={[d * 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow raycast={() => null}>
              <capsuleGeometry args={[0.05, 0.12, 5, 10]} />
              <meshStandardMaterial color="#4a8350" roughness={0.7} />
            </mesh>
            <mesh position={[d * 0.12, 0.09, 0]} castShadow raycast={() => null}>
              <capsuleGeometry args={[0.05, 0.12, 5, 10]} />
              <meshStandardMaterial color="#4a8350" roughness={0.7} />
            </mesh>
          </group>
        ))}
      {s >= 3 && (
        <mesh position={[0, h + 0.04, 0]} raycast={() => null}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#ff7fb0" emissive="#ff7fb0" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  );
}

function Bamboo({ s }) {
  const stalks = 2 + Math.floor(s / 2);
  const h = 0.3 + s * 0.13;
  return (
    <group>
      {Array.from({ length: stalks }).map((_, i) => {
        const a = (i / stalks) * Math.PI * 2;
        const r = i === 0 ? 0 : 0.06;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh position={[0, h / 2, 0]} castShadow raycast={() => null}>
              <cylinderGeometry args={[0.02, 0.024, h, 7]} />
              <meshStandardMaterial color="#7bbf52" roughness={0.7} />
            </mesh>
            {/* nodes */}
            {[0.3, 0.6, 0.9].map((t, j) => (
              <mesh key={j} position={[0, h * t, 0]} raycast={() => null}>
                <cylinderGeometry args={[0.026, 0.026, 0.02, 7]} />
                <meshStandardMaterial color="#5d9a3a" roughness={0.8} />
              </mesh>
            ))}
            {/* leaf blades near top */}
            {[-1, 1].map((d) => (
              <Leaf key={d} position={[d * 0.08, h * 0.92, 0]} rotation={[0, 0, d * 0.9]} scale={0.5} color="#6fb04a" />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Tulip({ s }) {
  const stems = 1 + Math.floor(s / 1.5);
  const h = 0.2 + s * 0.09;
  const colors = ['#ff7fb0', '#ffd24a', '#e8607a'];
  return (
    <group>
      {Array.from({ length: stems }).map((_, i) => {
        const a = (i / stems) * Math.PI * 2;
        const r = stems === 1 ? 0 : 0.07;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh position={[0, h / 2, 0]} castShadow raycast={() => null}>
              <cylinderGeometry args={[0.012, 0.014, h, 5]} />
              <meshStandardMaterial color={STEM} roughness={0.8} />
            </mesh>
            <Leaf position={[0.04, h * 0.3, 0]} rotation={[0, 0, 0.7]} scale={0.6} color={GREEN} />
            {/* cupped flower */}
            <group position={[0, h + 0.03, 0]}>
              {Array.from({ length: 4 }).map((_, p) => {
                const pa = (p / 4) * Math.PI * 2;
                return (
                  <mesh key={p} position={[Math.cos(pa) * 0.03, 0, Math.sin(pa) * 0.03]} rotation={[0.5, -pa, 0]} castShadow raycast={() => null}>
                    <boxGeometry args={[0.05, 0.08, 0.02]} />
                    <meshStandardMaterial color={colors[i % colors.length]} roughness={0.5} />
                  </mesh>
                );
              })}
            </group>
          </group>
        );
      })}
    </group>
  );
}

function Succulent({ s }) {
  const rings = [
    { n: 5, r: 0.12 + s * 0.02, y: 0.04, tilt: 0.9, c: '#7ac77a' },
    { n: 5, r: 0.08 + s * 0.015, y: 0.07, tilt: 0.6, c: '#6abf6a' },
    { n: 4, r: 0.045, y: 0.1, tilt: 0.3, c: '#8fd48f' },
  ];
  return (
    <group>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }).map((_, i) => {
          const a = (i / ring.n) * Math.PI * 2 + ri * 0.5;
          return (
            <mesh
              key={`${ri}-${i}`}
              position={[Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r]}
              rotation={[ring.tilt, -a, 0]}
              scale={[0.06, 0.02, 0.11]}
              castShadow
              raycast={() => null}
            >
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={ring.c} roughness={0.6} flatShading />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function Bonsai({ s }) {
  const pads = 2 + s;
  return (
    <group>
      {/* gnarled trunk */}
      <mesh position={[0.02, 0.12, 0]} rotation={[0, 0, -0.3]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.025, 0.045, 0.24, 6]} />
        <meshStandardMaterial color={TRUNK} roughness={0.9} />
      </mesh>
      <mesh position={[0.07, 0.26, 0]} rotation={[0, 0, 0.5]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.018, 0.028, 0.16, 6]} />
        <meshStandardMaterial color={TRUNK} roughness={0.9} />
      </mesh>
      {/* flat cascading foliage pads */}
      {Array.from({ length: pads }).map((_, i) => {
        const a = (i / pads) * Math.PI * 2;
        const r = 0.1 + (i % 2) * 0.06;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.28 + (i % 3) * 0.06, Math.sin(a) * r * 0.6]} scale={[0.14, 0.05, 0.14]} castShadow raycast={() => null}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={i % 2 ? GREEN : GREEN2} roughness={0.7} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

const SPECIES = {
  sunflower: Sunflower,
  rose: Rose,
  monstera: Monstera,
  cactus: Cactus,
  bamboo: Bamboo,
  tulip: Tulip,
  succulent: Succulent,
  bonsai: Bonsai,
};

export default function Plant3D({ stage = 2, potColors, species, sway = true, ...groupProps }) {
  const s = Math.max(0, Math.min(4, stage));
  const potTop = potColors?.[0] || '#ff9fc4';
  const potBot = potColors?.[1] || '#e76aa0';
  const Foliage = SPECIES[species] || SPECIES.bonsai;

  const ref = useRef();
  useFrame((state) => {
    if (!sway || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.035;
  });

  // sprout state: a couple of tiny leaves regardless of species
  return (
    <group {...groupProps}>
      <group ref={ref} position={[0, 0.13, 0]}>
        {s === 0 ? (
          <group>
            <mesh position={[0, 0.05, 0]} raycast={() => null}>
              <cylinderGeometry args={[0.01, 0.012, 0.1, 5]} />
              <meshStandardMaterial color={STEM} />
            </mesh>
            <Leaf position={[0.03, 0.1, 0]} rotation={[0, 0, 0.8]} scale={0.5} />
            <Leaf position={[-0.03, 0.1, 0]} rotation={[0, 0, -0.8]} scale={0.5} />
          </group>
        ) : (
          <Foliage s={s} />
        )}
      </group>

      {/* soil */}
      <mesh position={[0, 0.02, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#3a2e22" roughness={1} />
      </mesh>
      {/* pot */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.22, 0.16, 0.26, 16]} />
        <meshStandardMaterial color={potTop} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.02, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.235, 0.235, 0.04, 16]} />
        <meshStandardMaterial color={potBot} roughness={0.5} />
      </mesh>
    </group>
  );
}
