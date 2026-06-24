import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import useDecorColors from './useDecorColors';
import { useStore } from '../../store/useStore';
import Hotspot from './Hotspot';
import Cat from './Cat';
import Plant3D from './Plant3D';
import MoodLight from './MoodLight';

// Room dimensions (in world units). Floor at y=0.
const W = 3.6; // width  (x: -1.8 .. 1.8)
const D = 3.0; // depth  (z: -1.5 .. 1.5)
const H = 2.6; // height
const BACK_Z = -1.5;
const LEFT_X = -1.8;

// A small twinkling emissive star in the window.
function Star({ position, phase }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current)
      ref.current.material.emissiveIntensity = 0.6 + Math.sin(s.clock.elapsedTime * 2 + phase) * 0.5;
  });
  return (
    <mesh position={position} ref={ref} raycast={() => null}>
      <sphereGeometry args={[0.018, 6, 6]} />
      <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={0.8} toneMapped={false} />
    </mesh>
  );
}

// Slow-drifting dust motes catching the moonlight.
function DustMotes({ count = 10 }) {
  const ref = useRef();
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: [
          -1.2 + (i * 0.31) % 2.4,
          0.4 + (i * 0.43) % 1.6,
          -0.8 + (i * 0.27) % 1.6,
        ],
        speed: 0.15 + (i % 4) * 0.05,
        amp: 0.1 + (i % 3) * 0.05,
        phase: i * 1.7,
      })),
    [count],
  );
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.children.forEach((m, i) => {
      const cfg = motes[i];
      m.position.x = cfg.base[0] + Math.sin(t * cfg.speed + cfg.phase) * cfg.amp;
      m.position.y = cfg.base[1] + Math.cos(t * cfg.speed * 0.7 + cfg.phase) * cfg.amp;
    });
  });
  return (
    <group ref={ref}>
      {motes.map((m, i) => (
        <mesh key={i} position={m.base} raycast={() => null}>
          <sphereGeometry args={[0.012, 5, 5]} />
          <meshBasicMaterial color="#dfe3ff" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// The warm lamp light + a gentle flicker.
function Lamp() {
  const lightRef = useRef();
  useFrame((s) => {
    if (lightRef.current)
      lightRef.current.intensity = 1.4 + Math.sin(s.clock.elapsedTime * 7) * 0.08;
  });
  return (
    <group position={[1.4, 0, 1.0]}>
      {/* base */}
      <mesh position={[0, 0.04, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 12]} />
        <meshStandardMaterial color="#2a2440" roughness={0.8} />
      </mesh>
      {/* pole */}
      <mesh position={[0, 0.45, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.02, 0.02, 0.85, 8]} />
        <meshStandardMaterial color="#3a3160" />
      </mesh>
      {/* shade */}
      <mesh position={[0, 0.92, 0]} castShadow raycast={() => null}>
        <coneGeometry args={[0.22, 0.26, 16, 1, true]} />
        <meshStandardMaterial color="#fcd9a8" emissive="#ffb86b" emissiveIntensity={0.5} roughness={0.6} side={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.85, 0]} color="#ffb86b" intensity={1.4} distance={3.2} decay={2} />
    </group>
  );
}

// The window: night-sky panel + emissive moon + twinkling stars.
function Window() {
  const moonRef = useRef();
  useFrame((s) => {
    if (moonRef.current)
      moonRef.current.material.emissiveIntensity = 0.7 + Math.sin(s.clock.elapsedTime * 0.6) * 0.08;
  });
  // positions are relative to the window group
  const stars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        pos: [-0.42 + ((i * 0.41) % 0.85), -0.3 + ((i * 0.29) % 0.55), 0.04],
        phase: i * 0.9,
      })),
    [],
  );
  return (
    <group position={[-0.7, 1.7, BACK_Z + 0.015]}>
      {/* frame */}
      <mesh position={[0, 0, 0.0]} raycast={() => null}>
        <boxGeometry args={[1.18, 0.93, 0.04]} />
        <meshStandardMaterial color="#3a3f73" roughness={0.7} />
      </mesh>
      {/* night-sky panel inset into the frame */}
      <mesh position={[0, 0, 0.025]} raycast={() => null}>
        <planeGeometry args={[1.08, 0.83]} />
        <meshStandardMaterial color="#161a3e" emissive="#22275a" emissiveIntensity={0.5} />
      </mesh>
      {/* moon */}
      <mesh ref={moonRef} position={[0.3, 0.2, 0.04]} raycast={() => null}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fff7d6" emissive="#fde047" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* mullions */}
      <mesh position={[0, 0, 0.035]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.83, 0.02]} />
        <meshStandardMaterial color="#3a3f73" />
      </mesh>
      <mesh position={[0, 0, 0.035]} raycast={() => null}>
        <boxGeometry args={[1.08, 0.03, 0.02]} />
        <meshStandardMaterial color="#3a3f73" />
      </mesh>
      {stars.map((st, i) => (
        <Star key={i} position={st.pos} phase={st.phase} />
      ))}
    </group>
  );
}

// Shelf with little colored book boxes + a trophy.
function Shelf({ position }) {
  const bookColors = ['#f5a3c7', '#7dd3fc', '#9be89b', '#fde047', '#c084fc'];
  return (
    <group position={position}>
      {/* plank */}
      <mesh castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[0.9, 0.04, 0.22]} />
        <meshStandardMaterial color="#3a3160" roughness={0.8} />
      </mesh>
      {/* brackets */}
      <mesh position={[-0.4, -0.08, 0]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.12, 0.18]} />
        <meshStandardMaterial color="#2a2440" />
      </mesh>
      <mesh position={[0.4, -0.08, 0]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.12, 0.18]} />
        <meshStandardMaterial color="#2a2440" />
      </mesh>
      {/* books */}
      {bookColors.map((c, i) => (
        <mesh key={i} position={[-0.32 + i * 0.07, 0.11, 0]} castShadow raycast={() => null}>
          <boxGeometry args={[0.045, 0.14 + (i % 3) * 0.02, 0.14]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}
      {/* trophy */}
      <group position={[0.28, 0.08, 0]} raycast={() => null}>
        <mesh position={[0, 0.06, 0]} castShadow raycast={() => null}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.0, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
          <meshStandardMaterial color="#fde047" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.035, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.045, 0.05, 0.03, 12]} />
          <meshStandardMaterial color="#fdba74" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// Bed: frame / mattress / pillows / blanket.
function Bed({ position }) {
  return (
    <group position={position}>
      {/* frame */}
      <RoundedBox args={[1.5, 0.22, 1.0]} radius={0.04} smoothness={2} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5e4630" roughness={0.85} />
      </RoundedBox>
      {/* headboard */}
      <RoundedBox args={[1.5, 0.5, 0.08]} radius={0.04} smoothness={2} position={[0, 0.32, -0.46]} castShadow>
        <meshStandardMaterial color="#6b4f33" roughness={0.85} />
      </RoundedBox>
      {/* mattress */}
      <RoundedBox args={[1.4, 0.16, 0.92]} radius={0.06} smoothness={3} position={[0, 0.3, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial color="#e8e6f5" roughness={0.95} />
      </RoundedBox>
      {/* blanket */}
      <RoundedBox args={[1.42, 0.1, 0.6]} radius={0.05} smoothness={3} position={[0, 0.36, 0.2]} castShadow>
        <meshStandardMaterial color="#b8a9e8" roughness={0.9} />
      </RoundedBox>
      {/* pillows */}
      <RoundedBox args={[0.5, 0.12, 0.3]} radius={0.06} smoothness={3} position={[-0.35, 0.42, -0.26]} castShadow rotation={[0, 0.1, 0]}>
        <meshStandardMaterial color="#f5a3c7" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.12, 0.3]} radius={0.06} smoothness={3} position={[0.35, 0.42, -0.26]} castShadow rotation={[0, -0.1, 0]}>
        <meshStandardMaterial color="#7dd3fc" roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

// Armchair with the cat sitting in it -> /pet
function ArmchairWithCat({ position }) {
  return (
    <Hotspot to="/pet" label="Our pet" glow="#f5a3c7" position={position}>
      {/* seat */}
      <RoundedBox args={[0.7, 0.18, 0.6]} radius={0.08} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e76aa0" roughness={0.9} />
      </RoundedBox>
      {/* back */}
      <RoundedBox args={[0.7, 0.5, 0.16]} radius={0.08} smoothness={3} position={[0, 0.55, -0.24]} castShadow>
        <meshStandardMaterial color="#f5a3c7" roughness={0.9} />
      </RoundedBox>
      {/* arms */}
      <RoundedBox args={[0.14, 0.3, 0.6]} radius={0.06} smoothness={3} position={[-0.32, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#d75c90" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.3, 0.6]} radius={0.06} smoothness={3} position={[0.32, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#d75c90" roughness={0.9} />
      </RoundedBox>
      {/* legs */}
      {[[-0.28, 0, 0.24], [0.28, 0, 0.24], [-0.28, 0, -0.24], [0.28, 0, -0.24]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.11, p[2]]} raycast={() => null}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
          <meshStandardMaterial color="#2a2440" />
        </mesh>
      ))}
      {/* the cat -> shares this hotspot (armchair + cat -> /pet) */}
      <Cat position={[0, 0.42, 0.05]} />
    </Hotspot>
  );
}

// Coffee table holding an open book (-> /diary) and a heart envelope (-> /notes)
function CoffeeTable({ position }) {
  return (
    <group position={position}>
      {/* top */}
      <RoundedBox args={[0.9, 0.06, 0.5]} radius={0.03} smoothness={2} position={[0, 0.34, 0]} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial color="#5e4630" roughness={0.8} />
      </RoundedBox>
      {/* legs */}
      {[[-0.38, 0.16], [0.38, 0.16], [-0.38, -0.16], [0.38, -0.16]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.17, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
          <meshStandardMaterial color="#4a3726" />
        </mesh>
      ))}

      {/* open book -> /diary */}
      <Hotspot to="/diary" label="Diary" glow="#fef3e2" position={[-0.2, 0.37, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.02]} />
          <meshStandardMaterial color="#fef3e2" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, -0.15]} position={[0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.02]} />
          <meshStandardMaterial color="#fef3e2" roughness={0.9} />
        </mesh>
        {/* spine */}
        <mesh position={[0, -0.005, 0]} raycast={() => null}>
          <boxGeometry args={[0.02, 0.01, 0.2]} />
          <meshStandardMaterial color="#b8a9e8" />
        </mesh>
      </Hotspot>

      {/* heart envelope -> /notes */}
      <Hotspot to="/notes" label="Notes" glow="#ff6ba8" position={[0.26, 0.39, 0]}>
        <mesh rotation={[-Math.PI / 2.4, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.13, 0.015]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        {/* heart (two spheres + cone-ish) */}
        <group position={[0, 0.05, 0.05]} rotation={[0.4, 0, 0]}>
          <mesh position={[-0.02, 0.01, 0]} raycast={() => null}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.02, 0.01, 0]} raycast={() => null}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, -0.018, 0]} rotation={[0, 0, Math.PI]} raycast={() => null}>
            <coneGeometry args={[0.032, 0.04, 4]} />
            <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </Hotspot>
    </group>
  );
}

// TV with an emissive screen -> /games
function TV({ position }) {
  return (
    <Hotspot to="/games" label="Games" glow="#c084fc" position={position}>
      {/* stand */}
      <mesh position={[0, -0.18, 0]} raycast={() => null}>
        <boxGeometry args={[0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
      <mesh position={[0, -0.25, 0]} raycast={() => null}>
        <boxGeometry args={[0.3, 0.02, 0.16]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
      {/* bezel */}
      <RoundedBox args={[0.78, 0.46, 0.05]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color="#15182f" roughness={0.5} />
      </RoundedBox>
      {/* emissive screen */}
      <mesh position={[0, 0, 0.03]} raycast={() => null}>
        <planeGeometry args={[0.68, 0.38]} />
        <meshStandardMaterial color="#232a5c" emissive="#5a4f9e" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[-0.15, 0.02, 0.031]} raycast={() => null}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </Hotspot>
  );
}

// Speaker with a glowing cone -> /music
function Speaker({ position }) {
  return (
    <Hotspot to="/music" label="Music" glow="#67e8f9" position={position}>
      <RoundedBox args={[0.26, 0.6, 0.24]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#2a2440" roughness={0.7} />
      </RoundedBox>
      {/* woofer */}
      <mesh position={[0, 0.12, 0.13]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 20]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
      <mesh position={[0, 0.12, 0.14]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
        <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.14, 0.13]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
    </Hotspot>
  );
}

// Couple frame -> /about, map frame -> /map (hung on the back wall)
function WallFrames({ position }) {
  return (
    <group position={position}>
      <Hotspot to="/about" label="About us" glow="#b8a9e8" position={[-0.28, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.28, 0.03]} />
          <meshStandardMaterial color="#3a3160" />
        </mesh>
        <mesh position={[0, 0, 0.02]} raycast={() => null}>
          <planeGeometry args={[0.28, 0.22]} />
          <meshStandardMaterial color="#2a2f55" />
        </mesh>
        <mesh position={[-0.05, 0.0, 0.025]} raycast={() => null}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#b8a9e8" />
        </mesh>
        <mesh position={[0.05, 0.0, 0.025]} raycast={() => null}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#f5a3c7" />
        </mesh>
      </Hotspot>

      <Hotspot to="/map" label="Our map" glow="#7dd3fc" position={[0.28, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.26, 0.03]} />
          <meshStandardMaterial color="#2a3a5c" />
        </mesh>
        <mesh position={[0, 0, 0.02]} raycast={() => null}>
          <planeGeometry args={[0.26, 0.2]} />
          <meshStandardMaterial color="#1f2a44" emissive="#1a2440" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-0.04, 0.02, 0.025]} raycast={() => null}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.05, -0.02, 0.025]} raycast={() => null}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.4} />
        </mesh>
      </Hotspot>
    </group>
  );
}

// Decorative vase with flowers (non-interactive).
function Vase({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.06, 0.08, 0.16, 12]} />
        <meshStandardMaterial color="#b8a9e8" roughness={0.5} />
      </mesh>
      {[['#f5a3c7', -0.04], ['#fde047', 0], ['#9be89b', 0.04]].map(([c, dx], i) => (
        <mesh key={i} position={[dx, 0.2 + (i % 2) * 0.03, 0]} raycast={() => null}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

// The main room plant on a side table -> /plant (reads plant.stage from store)
function RoomPlant({ position }) {
  const plant = useStore((s) => s.plant);
  const { pot } = useDecorColors();
  const stage = plant?.stage ?? 2;
  return (
    <group position={position}>
      {/* side table */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.22, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#4a3726" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#3a2c20" />
      </mesh>
      {/* the plant as a hotspot -> /plant */}
      <Hotspot to="/plant" label="Our plant" glow={pot[0]} position={[0, 0.32, 0]} scale={0.62}>
        <Plant3D stage={stage} potColors={pot} />
      </Hotspot>
    </group>
  );
}

// Builds the whole cozy bedroom. decor wall/floor colors drive the surfaces.
export default function Furniture() {
  const { wall, floor } = useDecorColors();

  return (
    <group>
      {/* ── SHELL ── */}
      {/* floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={floor[0]} roughness={0.95} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, H / 2, BACK_Z]} receiveShadow raycast={() => null}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={wall[0]} roughness={1} />
      </mesh>
      {/* left wall */}
      <mesh position={[LEFT_X, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={wall[1]} roughness={1} />
      </mesh>

      {/* rug */}
      <mesh position={[0, 0.01, 0.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <circleGeometry args={[0.95, 40]} />
        <meshStandardMaterial color="#3a2f5e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.012, 0.7]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.78, 0.88, 40]} />
        <meshStandardMaterial color="#b8a9e8" roughness={1} />
      </mesh>

      {/* ── DECOR ── */}
      <Window />
      <MoodLight />

      {/* shelves on the back wall */}
      <Shelf position={[-1.1, 1.4, BACK_Z + 0.13]} />
      <WallFrames position={[1.0, 1.5, BACK_Z + 0.02]} />

      {/* furniture on the floor */}
      <Bed position={[-1.0, 0, -0.5]} />
      <TV position={[0.0, 1.35, BACK_Z + 0.06]} />
      <Speaker position={[-1.55, 0.3, 0.9]} />
      <ArmchairWithCat position={[1.05, 0, 0.0]} />
      <CoffeeTable position={[0.05, 0, 0.85]} />
      <RoomPlant position={[1.5, 0, -1.0]} />
      <Vase position={[-1.5, 0, -1.1]} />

      {/* lighting + ambience */}
      <Lamp />
      <DustMotes count={10} />
    </group>
  );
}
