import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import useDecorColors from './useDecorColors';
import { useStore } from '../../store/useStore';
import Hotspot from './Hotspot';
import Cat from './Cat';
import Plant3D from './Plant3D';
import MoodLight from './MoodLight';

// ── House footprint (dollhouse, open roof so you can orbit/pan/zoom into it) ──
const HALF_X = 3.65; // exterior wall centreline (interior face ≈ ±3.6)
const HALF_Z = 3.05;
const WALL_H = 2.0;
const WALL_T = 0.12;

// Room centres (x, z). z<0 = back, z>0 = front.
const BR = [-1.85, -1.55]; // Bedroom   (NW)
const LV = [1.85, -1.55]; // Living    (NE)
const ST = [-1.85, 1.55]; // Study     (SW)
const KT = [1.85, 1.55]; // Kitchen   (SE)

// ── A straight wall segment between two [x,z] points ──
function Wall({ a, b, height = WALL_H, t = WALL_T, color }) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) + t * 0.0;
  const cx = (a[0] + b[0]) / 2;
  const cz = (a[1] + b[1]) / 2;
  const angle = Math.atan2(dz, dx);
  return (
    <mesh position={[cx, height / 2, cz]} rotation={[0, -angle, 0]} castShadow receiveShadow raycast={() => null}>
      <boxGeometry args={[len, height, t]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

// A small twinkling emissive star in a window.
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
function DustMotes({ count = 14 }) {
  const ref = useRef();
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: [-3.0 + ((i * 0.81) % 6.0), 0.4 + ((i * 0.43) % 1.6), -2.4 + ((i * 0.57) % 4.8)],
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
          <meshBasicMaterial color="#dfe3ff" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// A floor/standing lamp with a warm flickering light.
function Lamp({ position }) {
  const lightRef = useRef();
  useFrame((s) => {
    if (lightRef.current) lightRef.current.intensity = 1.3 + Math.sin(s.clock.elapsedTime * 7) * 0.08;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 12]} />
        <meshStandardMaterial color="#2a2440" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.45, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.02, 0.02, 0.85, 8]} />
        <meshStandardMaterial color="#3a3160" />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow raycast={() => null}>
        <coneGeometry args={[0.22, 0.26, 16, 1, true]} />
        <meshStandardMaterial color="#fcd9a8" emissive="#ffb86b" emissiveIntensity={0.5} roughness={0.6} side={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.85, 0]} color="#ffb86b" intensity={1.3} distance={3.0} decay={2} />
    </group>
  );
}

// A window: night-sky panel + emissive moon + twinkling stars. Placeable.
function Window({ position, rotation = [0, 0, 0], moon = true }) {
  const moonRef = useRef();
  useFrame((s) => {
    if (moonRef.current)
      moonRef.current.material.emissiveIntensity = 0.7 + Math.sin(s.clock.elapsedTime * 0.6) * 0.08;
  });
  const stars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        pos: [-0.42 + ((i * 0.41) % 0.85), -0.3 + ((i * 0.29) % 0.55), 0.04],
        phase: i * 0.9,
      })),
    [],
  );
  return (
    <group position={position} rotation={rotation}>
      <mesh raycast={() => null}>
        <boxGeometry args={[1.0, 0.85, 0.04]} />
        <meshStandardMaterial color="#3a3f73" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.025]} raycast={() => null}>
        <planeGeometry args={[0.9, 0.75]} />
        <meshStandardMaterial color="#161a3e" emissive="#22275a" emissiveIntensity={0.5} />
      </mesh>
      {moon && (
        <mesh ref={moonRef} position={[0.26, 0.18, 0.04]} raycast={() => null}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#fff7d6" emissive="#fde047" emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.035]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.75, 0.02]} />
        <meshStandardMaterial color="#3a3f73" />
      </mesh>
      <mesh position={[0, 0, 0.035]} raycast={() => null}>
        <boxGeometry args={[0.9, 0.03, 0.02]} />
        <meshStandardMaterial color="#3a3f73" />
      </mesh>
      {stars.map((st, i) => (
        <Star key={i} position={st.pos} phase={st.phase} />
      ))}
    </group>
  );
}

// Shelf with little colored book boxes + a trophy.
function Shelf({ position, rotation }) {
  const bookColors = ['#f5a3c7', '#7dd3fc', '#9be89b', '#fde047', '#c084fc'];
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[0.9, 0.04, 0.22]} />
        <meshStandardMaterial color="#3a3160" roughness={0.8} />
      </mesh>
      <mesh position={[-0.4, -0.08, 0]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.12, 0.18]} />
        <meshStandardMaterial color="#2a2440" />
      </mesh>
      <mesh position={[0.4, -0.08, 0]} raycast={() => null}>
        <boxGeometry args={[0.03, 0.12, 0.18]} />
        <meshStandardMaterial color="#2a2440" />
      </mesh>
      {bookColors.map((c, i) => (
        <mesh key={i} position={[-0.32 + i * 0.07, 0.11, 0]} castShadow raycast={() => null}>
          <boxGeometry args={[0.045, 0.14 + (i % 3) * 0.02, 0.14]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}
      <group position={[0.28, 0.08, 0]}>
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
function Bed({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.5, 0.22, 1.0]} radius={0.04} smoothness={2} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5e4630" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.5, 0.08]} radius={0.04} smoothness={2} position={[0, 0.32, -0.46]} castShadow>
        <meshStandardMaterial color="#6b4f33" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.4, 0.16, 0.92]} radius={0.06} smoothness={3} position={[0, 0.3, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial color="#e8e6f5" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.42, 0.1, 0.6]} radius={0.05} smoothness={3} position={[0, 0.36, 0.2]} castShadow>
        <meshStandardMaterial color="#b8a9e8" roughness={0.9} />
      </RoundedBox>
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
function ArmchairWithCat({ position, rotation }) {
  return (
    <Hotspot to="/pet" label="Our pet" glow="#f5a3c7" position={position} rotation={rotation}>
      <RoundedBox args={[0.7, 0.18, 0.6]} radius={0.08} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e76aa0" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.16]} radius={0.08} smoothness={3} position={[0, 0.55, -0.24]} castShadow>
        <meshStandardMaterial color="#f5a3c7" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.3, 0.6]} radius={0.06} smoothness={3} position={[-0.32, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#d75c90" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.3, 0.6]} radius={0.06} smoothness={3} position={[0.32, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#d75c90" roughness={0.9} />
      </RoundedBox>
      {[[-0.28, 0, 0.24], [0.28, 0, 0.24], [-0.28, 0, -0.24], [0.28, 0, -0.24]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.11, p[2]]} raycast={() => null}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
          <meshStandardMaterial color="#2a2440" />
        </mesh>
      ))}
      <Cat position={[0, 0.42, 0.05]} />
    </Hotspot>
  );
}

// Coffee table holding an open book (-> /diary) and a heart envelope (-> /notes)
function CoffeeTable({ position }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.9, 0.06, 0.5]} radius={0.03} smoothness={2} position={[0, 0.34, 0]} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial color="#5e4630" roughness={0.8} />
      </RoundedBox>
      {[[-0.38, 0.16], [0.38, 0.16], [-0.38, -0.16], [0.38, -0.16]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.17, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
          <meshStandardMaterial color="#4a3726" />
        </mesh>
      ))}

      <Hotspot to="/diary" label="Diary" glow="#fef3e2" position={[-0.2, 0.37, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.02]} />
          <meshStandardMaterial color="#fef3e2" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, -0.15]} position={[0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.02]} />
          <meshStandardMaterial color="#fef3e2" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.005, 0]} raycast={() => null}>
          <boxGeometry args={[0.02, 0.01, 0.2]} />
          <meshStandardMaterial color="#b8a9e8" />
        </mesh>
      </Hotspot>

      <Hotspot to="/notes" label="Notes" glow="#ff6ba8" position={[0.26, 0.39, 0]}>
        <mesh rotation={[-Math.PI / 2.4, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.13, 0.015]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
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
function TV({ position, rotation }) {
  return (
    <Hotspot to="/games" label="Games" glow="#c084fc" position={position} rotation={rotation}>
      <mesh position={[0, -0.18, 0]} raycast={() => null}>
        <boxGeometry args={[0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
      <mesh position={[0, -0.25, 0]} raycast={() => null}>
        <boxGeometry args={[0.3, 0.02, 0.16]} />
        <meshStandardMaterial color="#15182f" />
      </mesh>
      <RoundedBox args={[0.78, 0.46, 0.05]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color="#15182f" roughness={0.5} />
      </RoundedBox>
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

// Couple frame -> /about, map frame -> /map (hung on a wall)
function WallFrames({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
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
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.22, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#4a3726" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#3a2c20" />
      </mesh>
      <Hotspot to="/plant" label="Our plant" glow={pot[0]} position={[0, 0.32, 0]} scale={0.62}>
        <Plant3D stage={stage} potColors={pot} />
      </Hotspot>
    </group>
  );
}

// Cosy fireplace with a live flame -> /campfire
function Fireplace({ position, rotation }) {
  const flameRef = useRef();
  const lightRef = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (flameRef.current) flameRef.current.scale.set(1, 0.85 + Math.sin(t * 9) * 0.18, 1);
    if (lightRef.current) lightRef.current.intensity = 1.3 + Math.sin(t * 7.3) * 0.25;
  });
  return (
    <Hotspot to="/campfire" label="Campfire" glow="#fb923c" position={position} rotation={rotation}>
      {/* surround */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.0, 1.2, 0.3]} />
        <meshStandardMaterial color="#3a3160" roughness={0.95} />
      </mesh>
      {/* mantel */}
      <mesh position={[0, 1.24, 0.04]} castShadow raycast={() => null}>
        <boxGeometry args={[1.12, 0.08, 0.42]} />
        <meshStandardMaterial color="#5e4630" roughness={0.8} />
      </mesh>
      {/* dark cavity */}
      <mesh position={[0, 0.46, 0.12]} raycast={() => null}>
        <boxGeometry args={[0.66, 0.66, 0.14]} />
        <meshStandardMaterial color="#120e1f" />
      </mesh>
      {/* logs */}
      <mesh position={[0, 0.24, 0.16]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
        <cylinderGeometry args={[0.045, 0.045, 0.5, 8]} />
        <meshStandardMaterial color="#5e4630" emissive="#ff6a2c" emissiveIntensity={0.25} />
      </mesh>
      {/* flame */}
      <mesh ref={flameRef} position={[0, 0.44, 0.16]} raycast={() => null}>
        <coneGeometry args={[0.16, 0.42, 12]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ff8a3c" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.38, 0.17]} raycast={() => null}>
        <coneGeometry args={[0.09, 0.26, 10]} />
        <meshStandardMaterial color="#fff1b8" emissive="#ffd36b" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.5, 0.4]} color="#ff8a3c" intensity={1.3} distance={3.2} decay={2} />
    </Hotspot>
  );
}

// Fish tank on a stand -> /fishtank
function FishTank3D({ position }) {
  const fishRef = useRef();
  useFrame((s) => {
    if (!fishRef.current) return;
    const t = s.clock.elapsedTime;
    fishRef.current.children.forEach((f, i) => {
      f.position.x = Math.sin(t * 0.9 + i * 1.7) * 0.18;
      f.position.z = Math.cos(t * 0.7 + i) * 0.07;
    });
  });
  return (
    <Hotspot to="/fishtank" label="Fish tank" glow="#67e8f9" position={position}>
      {/* stand */}
      <mesh position={[0, 0.3, 0]} castShadow raycast={() => null}>
        <boxGeometry args={[0.74, 0.6, 0.4]} />
        <meshStandardMaterial color="#3a2c20" roughness={0.85} />
      </mesh>
      {/* glass tank */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.7, 0.42, 0.36]} />
        <meshStandardMaterial color="#8fd6fb" transparent opacity={0.34} roughness={0.08} metalness={0.1} />
      </mesh>
      {/* water glow */}
      <pointLight position={[0, 0.8, 0]} color="#67e8f9" intensity={0.45} distance={1.6} decay={2} />
      {/* fish */}
      <group ref={fishRef} position={[0, 0.8, 0]}>
        {['#fdba74', '#ff6ba8', '#fde047'].map((c, i) => (
          <mesh key={i} position={[0, (i - 1) * 0.1, 0]} rotation={[0, 0, -Math.PI / 2]} raycast={() => null}>
            <coneGeometry args={[0.04, 0.11, 8]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>
    </Hotspot>
  );
}

// A planter of growing plants -> /garden
function GardenPlanter({ position }) {
  const { pot } = useDecorColors();
  return (
    <Hotspot to="/garden" label="Garden" glow="#9be89b" position={position}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[1.0, 0.26, 0.36]} />
        <meshStandardMaterial color="#6b4f33" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.26, 0]} raycast={() => null}>
        <boxGeometry args={[0.92, 0.04, 0.3]} />
        <meshStandardMaterial color="#2e2116" />
      </mesh>
      <group position={[-0.3, 0.27, 0]} scale={0.34}>
        <Plant3D stage={3} potColors={pot} species="monstera" sway />
      </group>
      <group position={[0.0, 0.27, 0]} scale={0.36}>
        <Plant3D stage={4} potColors={pot} species="sunflower" sway />
      </group>
      <group position={[0.32, 0.27, 0]} scale={0.32}>
        <Plant3D stage={3} potColors={pot} species="rose" sway />
      </group>
    </Hotspot>
  );
}

// Kitchen counter + fridge (non-interactive ambience).
function Kitchen({ position }) {
  return (
    <group position={position}>
      {/* counter */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1.4, 0.08, 0.5]} />
        <meshStandardMaterial color="#cdbfe6" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]} raycast={() => null}>
        <boxGeometry args={[1.36, 0.4, 0.46]} />
        <meshStandardMaterial color="#3a3160" roughness={0.85} />
      </mesh>
      {/* sink */}
      <mesh position={[-0.3, 0.47, 0]} raycast={() => null}>
        <boxGeometry args={[0.34, 0.04, 0.28]} />
        <meshStandardMaterial color="#9aa3c8" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* fridge */}
      <group position={[0.95, 0, 0]}>
        <RoundedBox args={[0.5, 1.3, 0.5]} radius={0.04} smoothness={2} position={[0, 0.65, 0]} castShadow>
          <meshStandardMaterial color="#e8e6f5" roughness={0.4} metalness={0.1} />
        </RoundedBox>
        <mesh position={[0.2, 0.85, 0.26]} raycast={() => null}>
          <boxGeometry args={[0.03, 0.3, 0.02]} />
          <meshStandardMaterial color="#b8a9e8" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Small soft fill light (no shadow) to keep a room from going too dark.
function Fill({ position, color = '#6a6ab0', intensity = 0.35 }) {
  return <pointLight position={position} color={color} intensity={intensity} distance={4.5} decay={2} />;
}

// ── The whole house: 4 connected rooms, open roof, decor-driven surfaces ──
export default function Furniture() {
  const { wall, floor } = useDecorColors();

  // per-room floor tints for visual separation
  const floors = [
    { c: floor[0], at: BR }, // bedroom
    { c: '#43354f', at: LV }, // living (warm plum)
    { c: '#2f3a4e', at: ST }, // study (cool)
    { c: '#3c3340', at: KT }, // kitchen
  ];

  return (
    <group>
      {/* ── base floor ── */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[HALF_X * 2, HALF_Z * 2]} />
        <meshStandardMaterial color={floor[1]} roughness={1} />
      </mesh>
      {floors.map((f, i) => (
        <mesh key={i} position={[f.at[0], 0.0, f.at[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
          <planeGeometry args={[3.4, 2.8]} />
          <meshStandardMaterial color={f.c} roughness={1} />
        </mesh>
      ))}

      {/* ── exterior walls ── */}
      <Wall a={[-HALF_X, -HALF_Z]} b={[HALF_X, -HALF_Z]} color={wall[0]} />
      <Wall a={[-HALF_X, HALF_Z]} b={[HALF_X, HALF_Z]} color={wall[1]} />
      <Wall a={[-HALF_X, -HALF_Z]} b={[-HALF_X, HALF_Z]} color={wall[1]} />
      <Wall a={[HALF_X, -HALF_Z]} b={[HALF_X, HALF_Z]} color={wall[0]} />

      {/* ── interior wall along x=0 (door gaps at the room centres) ── */}
      <Wall a={[0, -HALF_Z]} b={[0, -2.05]} color={wall[1]} height={WALL_H * 0.96} />
      <Wall a={[0, -0.95]} b={[0, 0.95]} color={wall[1]} height={WALL_H * 0.96} />
      <Wall a={[0, 2.05]} b={[0, HALF_Z]} color={wall[1]} height={WALL_H * 0.96} />

      {/* ── interior wall along z=0 (door gaps) ── */}
      <Wall a={[-HALF_X, 0]} b={[-2.4, 0]} color={wall[1]} height={WALL_H * 0.96} />
      <Wall a={[-1.3, 0]} b={[1.3, 0]} color={wall[1]} height={WALL_H * 0.96} />
      <Wall a={[2.4, 0]} b={[HALF_X, 0]} color={wall[1]} height={WALL_H * 0.96} />

      {/* ── windows on exterior walls ── */}
      <Window position={[-1.85, 1.4, -HALF_Z + 0.07]} />
      <Window position={[1.85, 1.4, -HALF_Z + 0.07]} moon={false} />
      <Window position={[-HALF_X + 0.07, 1.4, 1.85]} rotation={[0, Math.PI / 2, 0]} moon={false} />

      {/* ════════ BEDROOM (NW) ════════ */}
      <Bed position={[BR[0] - 0.45, 0, BR[1] - 0.55]} />
      <RoomPlant position={[BR[0] + 1.25, 0, BR[1] + 0.9]} />
      <Vase position={[BR[0] - 1.4, 0, BR[1] - 1.15]} />
      <Lamp position={[BR[0] + 1.25, 0, BR[1] - 1.0]} />
      <MoodLight position={[BR[0] - 0.4, 1.55, BR[1] - 0.4]} spread={0.5} />

      {/* ════════ LIVING (NE) ════════ */}
      {/* TV on the north wall facing into the room */}
      <TV position={[LV[0], 1.35, -HALF_Z + 0.16]} />
      <Speaker position={[LV[0] + 1.3, 0.3, -HALF_Z + 0.35]} />
      {/* armchair facing the TV (north) */}
      <ArmchairWithCat position={[LV[0], 0, LV[1] + 0.55]} rotation={[0, Math.PI, 0]} />
      <CoffeeTable position={[LV[0], 0, LV[1] - 0.35]} />
      {/* rug under the living set */}
      <mesh position={[LV[0], 0.012, LV[1]]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.95, 40]} />
        <meshStandardMaterial color="#3a2f5e" roughness={1} />
      </mesh>
      <Fill position={[LV[0], 1.7, LV[1]]} color="#7a6ab0" intensity={0.3} />

      {/* ════════ STUDY (SW) ════════ */}
      <Shelf position={[ST[0] - 0.3, 1.4, HALF_Z - 0.14]} rotation={[0, Math.PI, 0]} />
      <WallFrames position={[ST[0] + 0.6, 1.5, HALF_Z - 0.07]} rotation={[0, Math.PI, 0]} />
      <FishTank3D position={[-HALF_X + 0.45, 0, ST[1] + 0.35]} />
      <GardenPlanter position={[ST[0] + 0.2, 0, HALF_Z - 0.35]} />
      <Fill position={[ST[0], 1.6, ST[1]]} color="#5fb0a0" intensity={0.28} />

      {/* ════════ KITCHEN (SE) ════════ */}
      <Kitchen position={[KT[0] - 0.1, 0, HALF_Z - 0.35]} />
      <Fireplace position={[HALF_X - 0.16, 0, KT[1] + 0.2]} rotation={[0, -Math.PI / 2, 0]} />

      {/* ── shared ambience ── */}
      <DustMotes count={16} />
    </group>
  );
}
