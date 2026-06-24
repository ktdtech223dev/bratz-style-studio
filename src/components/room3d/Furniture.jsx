import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import useDecorColors from './useDecorColors';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';
import Hotspot from './Hotspot';
import Cat from './Cat';
import Plant3D from './Plant3D';
import MoodLight from './MoodLight';
import Environment from './Environment';
import Avatar from './Avatar';
import GardenArea from './GardenArea';
import {
  Sofa,
  DiningSet,
  BedFrame,
  Crib,
  Dresser,
  NightStand,
  Toybox,
  Bookshelf,
  FloorLamp,
  AreaRug,
  CatCollar,
} from './furniture';
import { getFloorplan } from './themes';
import Exterior from './Exterior';

// ── 3-bedroom dollhouse (open roof). 3 columns × 2 rows + an attached garden. ──
const HALF_X = 3.7;
const HALF_Z = 2.7;
const WALL_H = 2.0;
const WALL_T = 0.12;
const COLX = [-2.45, 0, 2.45]; // Keshawn|Living|Mercury  /  Baby|Kitchen|Study
const ROWZ = [-1.35, 1.35];
const KS = [COLX[0], ROWZ[0]]; // Keshawn's room
const LV = [COLX[1], ROWZ[0]]; // Living
const MC = [COLX[2], ROWZ[0]]; // Mercury's room
const BABY = [COLX[0], ROWZ[1]];
const KT = [COLX[1], ROWZ[1]]; // Kitchen
const ST = [COLX[2], ROWZ[1]]; // Study

function Wall({ a, b, height = WALL_H, t = WALL_T, color }) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  return (
    <mesh position={[(a[0] + b[0]) / 2, height / 2, (a[1] + b[1]) / 2]} rotation={[0, -angle, 0]} castShadow receiveShadow raycast={() => null}>
      <boxGeometry args={[len, height, t]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function Star({ position, phase }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.6 + Math.sin(s.clock.elapsedTime * 2 + phase) * 0.5;
  });
  return (
    <mesh position={position} ref={ref} raycast={() => null}>
      <sphereGeometry args={[0.018, 6, 6]} />
      <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={0.8} toneMapped={false} />
    </mesh>
  );
}

function DustMotes({ count = 16 }) {
  const ref = useRef();
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: [-3.0 + ((i * 0.81) % 6.0), 0.4 + ((i * 0.43) % 1.6), -2.2 + ((i * 0.57) % 4.4)],
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

function Window({ position, rotation = [0, 0, 0], moon = true }) {
  const moonRef = useRef();
  useFrame((s) => {
    if (moonRef.current) moonRef.current.material.emissiveIntensity = 0.7 + Math.sin(s.clock.elapsedTime * 0.6) * 0.08;
  });
  const stars = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ pos: [-0.38 + ((i * 0.41) % 0.78), -0.26 + ((i * 0.29) % 0.5), 0.04], phase: i * 0.9 })), []);
  return (
    <group position={position} rotation={rotation}>
      <mesh raycast={() => null}>
        <boxGeometry args={[0.92, 0.78, 0.04]} />
        <meshStandardMaterial color="#3a3f73" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.025]} raycast={() => null}>
        <planeGeometry args={[0.82, 0.68]} />
        <meshStandardMaterial color="#161a3e" emissive="#22275a" emissiveIntensity={0.5} />
      </mesh>
      {moon && (
        <mesh ref={moonRef} position={[0.24, 0.16, 0.04]} raycast={() => null}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#fff7d6" emissive="#fde047" emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      )}
      {stars.map((st, i) => (
        <Star key={i} position={st.pos} phase={st.phase} />
      ))}
    </group>
  );
}

// TV -> /games
function TV({ position, rotation }) {
  return (
    <Hotspot to="/games" label="Games" glow="#c084fc" position={position} rotation={rotation}>
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

// Speaker -> /music
function Speaker({ position }) {
  return (
    <Hotspot to="/music" label="Music" glow="#67e8f9" position={position}>
      <RoundedBox args={[0.26, 0.6, 0.24]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#2a2440" roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.12, 0.14]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
    </Hotspot>
  );
}

// Frames -> /about + /map
function WallFrames({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <Hotspot to="/about" label="About us" glow="#b8a9e8" position={[-0.28, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.28, 0.03]} />
          <meshStandardMaterial color="#3a3160" />
        </mesh>
        <mesh position={[-0.05, 0, 0.02]} raycast={() => null}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#b8a9e8" />
        </mesh>
        <mesh position={[0.05, 0, 0.02]} raycast={() => null}>
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
      </Hotspot>
    </group>
  );
}

// Coffee table (decor color) holding book -> /diary + envelope -> /notes
function CoffeeTable({ position, color = '#5e4630' }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.9, 0.06, 0.5]} radius={0.03} smoothness={2} position={[0, 0.34, 0]} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      {[[-0.38, 0.16], [0.38, 0.16], [-0.38, -0.16], [0.38, -0.16]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.17, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
          <meshStandardMaterial color="#4a3726" />
        </mesh>
      ))}
      <Hotspot to="/diary" label="Diary" glow="#fef3e2" position={[-0.2, 0.37, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.15]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.03]} />
          <meshStandardMaterial color="#fef3e2" roughness={0.9} />
        </mesh>
      </Hotspot>
      <Hotspot to="/notes" label="Notes" glow="#ff6ba8" position={[0.26, 0.39, 0]}>
        <mesh rotation={[-Math.PI / 2.4, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.13, 0.015]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, 0.04]} rotation={[0.4, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.3} />
        </mesh>
      </Hotspot>
    </group>
  );
}

// Armchair + cat (with optional decor collar) -> /pet
function ArmchairWithCat({ position, rotation, collar }) {
  return (
    <Hotspot to="/pet" label="Our pet" glow="#f5a3c7" position={position} rotation={rotation}>
      <RoundedBox args={[0.7, 0.18, 0.6]} radius={0.08} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e76aa0" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.16]} radius={0.08} smoothness={3} position={[0, 0.55, -0.24]} castShadow>
        <meshStandardMaterial color="#f5a3c7" roughness={0.9} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.14, 0.3, 0.6]} radius={0.06} smoothness={3} position={[s * 0.32, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#d75c90" roughness={0.9} />
        </RoundedBox>
      ))}
      <group position={[0, 0.42, 0.05]}>
        <Cat position={[0, 0, 0]} />
        {collar && <CatCollar color={collar.color} position={[0, 0.12, 0.16]} scale={0.8} />}
      </group>
    </Hotspot>
  );
}

// Fireplace -> /campfire
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
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.0, 1.2, 0.3]} />
        <meshStandardMaterial color="#3a3160" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.46, 0.12]} raycast={() => null}>
        <boxGeometry args={[0.66, 0.66, 0.14]} />
        <meshStandardMaterial color="#120e1f" />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.44, 0.16]} raycast={() => null}>
        <coneGeometry args={[0.16, 0.42, 12]} />
        <meshStandardMaterial color="#ffd36b" emissive="#ff8a3c" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.5, 0.4]} color="#ff8a3c" intensity={1.3} distance={3.2} decay={2} />
    </Hotspot>
  );
}

// Fish tank -> /fishtank
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
      <mesh position={[0, 0.3, 0]} castShadow raycast={() => null}>
        <boxGeometry args={[0.74, 0.6, 0.4]} />
        <meshStandardMaterial color="#3a2c20" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.7, 0.42, 0.36]} />
        <meshStandardMaterial color="#8fd6fb" transparent opacity={0.34} roughness={0.08} metalness={0.1} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#67e8f9" intensity={0.45} distance={1.6} decay={2} />
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

// Kitchen counter + fridge (-> /recipes)
function KitchenArea({ position, tableColor }) {
  return (
    <group position={position}>
      {/* counter */}
      <mesh position={[-0.4, 0.42, 0]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[1.1, 0.08, 0.5]} />
        <meshStandardMaterial color="#cdbfe6" roughness={0.5} />
      </mesh>
      <mesh position={[-0.4, 0.2, 0]} raycast={() => null}>
        <boxGeometry args={[1.06, 0.4, 0.46]} />
        <meshStandardMaterial color="#3a3160" roughness={0.85} />
      </mesh>
      <mesh position={[-0.6, 0.47, 0]} raycast={() => null}>
        <boxGeometry args={[0.3, 0.04, 0.28]} />
        <meshStandardMaterial color="#9aa3c8" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* fridge -> /recipes */}
      <Hotspot to="/recipes" label="Recipes" glow="#9be89b" position={[0.6, 0, 0]}>
        <RoundedBox args={[0.5, 1.3, 0.5]} radius={0.04} smoothness={2} position={[0, 0.65, 0]} castShadow>
          <meshStandardMaterial color="#e8e6f5" roughness={0.4} metalness={0.1} />
        </RoundedBox>
        <mesh position={[0, 0.92, 0]} raycast={() => null}>
          <boxGeometry args={[0.5, 0.02, 0.5]} />
          <meshStandardMaterial color="#cdc8da" />
        </mesh>
        <mesh position={[0.2, 0.95, 0.26]} raycast={() => null}>
          <boxGeometry args={[0.03, 0.3, 0.02]} />
          <meshStandardMaterial color="#9aa3c8" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* a couple of fridge magnets for charm */}
        <mesh position={[-0.1, 0.85, 0.26]} raycast={() => null}>
          <circleGeometry args={[0.03, 12]} />
          <meshStandardMaterial color="#ff6ba8" emissive="#ff6ba8" emissiveIntensity={0.2} />
        </mesh>
      </Hotspot>
    </group>
  );
}

// the main plant -> /plant
function RoomPlant({ position, pot }) {
  const plant = useStore((s) => s.plant);
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

// A telescope in the garden -> /starmap
function Telescope({ position }) {
  return (
    <Hotspot to="/starmap" label="Star map" glow="#fde047" position={position}>
      <mesh position={[0, 0.5, 0]} rotation={[0.5, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 12]} />
        <meshStandardMaterial color="#2a2440" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.16, 0.66, 0.08]} raycast={() => null}>
        <cylinderGeometry args={[0.055, 0.045, 0.1, 12]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[[-0.12, 0.12, 0][i] || (i === 1 ? 0.12 : 0), 0.18, [0.1, 0.1, -0.14][i]]} rotation={[i === 2 ? -0.4 : 0.4, 0, i === 0 ? 0.4 : -0.4]} raycast={() => null}>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 6]} />
          <meshStandardMaterial color="#3a3160" />
        </mesh>
      ))}
    </Hotspot>
  );
}

// Avatars for me + partner — at their saved layout spot (or the theme seed),
// shown active when present.
function Avatars({ seed, bounds }) {
  const users = useStore((s) => s.users);
  const presence = useStore((s) => s.presence);
  const me = useStore((s) => s.me);
  const avatarLayout = useStore((s) => s.avatarLayout);
  const arrange = useStore((s) => s.arrangeMode);
  const sel = useStore((s) => s.arrangeSel);
  const setSel = useStore((s) => s.setArrangeSel);
  return (
    <group>
      {(users || []).slice(0, 2).map((u, i) => {
        const saved = avatarLayout?.[u.id];
        const s = (seed && seed[i]) || [0, 0, 0];
        const pos = saved ? [saved.x, 0, saved.z] : [s[0], 0, s[1]];
        const rot = saved ? saved.rot || 0 : s[2] || 0;
        const active = u.id === me?.id || !!presence?.[u.id];
        if (arrange && u.id === me?.id && bounds) {
          return (
            <DraggablePiece
              key={u.id}
              position={pos}
              rot={rot}
              bounds={bounds}
              selected={sel === `a${u.id}`}
              onSelect={() => setSel(`a${u.id}`)}
              onMoved={(x, z) => api.post('/api/avatars/move', { userId: u.id, x, z, rot }).catch(() => {})}
            >
              <Avatar color={u.color} name={u.display_name} active={active} />
            </DraggablePiece>
          );
        }
        return (
          <Avatar key={u.id} color={u.color} name={u.display_name} active={active} position={pos} rotation={[0, rot, 0]} />
        );
      })}
    </group>
  );
}

// role (nav fitting) → renderer
const FITTING = {
  tv: (f, d) => <TV position={f.at} rotation={[0, f.rot || 0, 0]} />,
  speaker: (f) => <Speaker position={f.at} />,
  frames: (f) => <WallFrames position={f.at} rotation={[0, f.rot || 0, 0]} />,
  coffeetable: (f, d) => <CoffeeTable position={f.at} color={d.table.color} />,
  armchair: (f, d) => <ArmchairWithCat position={f.at} rotation={[0, f.rot || 0, 0]} collar={d.collar} />,
  fireplace: (f) => <Fireplace position={f.at} rotation={[0, f.rot || 0, 0]} />,
  fishtank: (f) => <FishTank3D position={f.at} />,
  kitchen: (f, d) => <KitchenArea position={f.at} tableColor={d.table.color} />,
  plant: (f, d) => <RoomPlant position={f.at} pot={d.pot} />,
  telescope: (f) => <Telescope position={f.at} />,
};

// decorative furniture kind → component (colors from live decor)
function furnPiece(kind, pos, rotY, d, key) {
  const rot = [0, rotY || 0, 0];
  switch (kind) {
    case 'sofa':
      return <Sofa key={key} color={d.sofa.color} style={d.sofa.style} position={pos} rotation={rot} />;
    case 'bed':
      return <BedFrame key={key} color={d.bed.color} sheets={d.bed.sheets} position={pos} rotation={rot} />;
    case 'crib':
      return <Crib key={key} color="#cdbfe6" position={pos} rotation={rot} />;
    case 'dresser':
      return <Dresser key={key} color="#6b4f33" position={pos} rotation={rot} />;
    case 'nightstand':
      return <NightStand key={key} color={d.bed.color} position={pos} rotation={rot} />;
    case 'bookshelf':
      return <Bookshelf key={key} color="#3a3160" position={pos} rotation={rot} />;
    case 'lamp':
      return <FloorLamp key={key} color={d.lamp.color} position={pos} rotation={rot} />;
    case 'rug':
      return <AreaRug key={key} color={d.rug.color} position={pos} rotation={rot} />;
    case 'dining':
      return <DiningSet key={key} color={d.table.color} position={pos} rotation={rot} />;
    case 'toybox':
      return <Toybox key={key} color="#7dd3fc" position={pos} rotation={rot} />;
    default:
      return null;
  }
}

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Wraps a piece so it can be selected + dragged on the floor plane in arrange
// mode. Disables OrbitControls while dragging (controls.makeDefault required).
function DraggablePiece({ position, rot, bounds, selected, onSelect, onMoved, children }) {
  const controls = useThree((s) => s.controls);
  const ref = useRef();
  const drag = useRef(false);
  const grab = useRef([0, 0]);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const hx = bounds.halfX + 0.2;
  const zMin = -bounds.halfZ - 0.2;
  const zMax = bounds.halfZ + 2.6;

  function down(e) {
    e.stopPropagation();
    onSelect();
    try { e.target.setPointerCapture(e.pointerId); } catch {}
    drag.current = true;
    if (controls) controls.enabled = false;
    if (e.ray.intersectPlane(plane, hit) && ref.current) {
      grab.current = [hit.x - ref.current.position.x, hit.z - ref.current.position.z];
    }
  }
  function move(e) {
    if (!drag.current || !ref.current) return;
    if (e.ray.intersectPlane(plane, hit)) {
      ref.current.position.x = clampN(hit.x - grab.current[0], -hx, hx);
      ref.current.position.z = clampN(hit.z - grab.current[1], zMin, zMax);
    }
  }
  function end(e) {
    if (!drag.current) return;
    drag.current = false;
    if (controls) controls.enabled = true;
    try { e.target.releasePointerCapture(e.pointerId); } catch {}
    if (ref.current) onMoved(ref.current.position.x, ref.current.position.z);
  }

  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, rot || 0, 0]}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {/* invisible, raycastable hit proxy (children use raycast=null) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.0, 0.9, 1.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.5, 0.66, 32]} />
          <meshBasicMaterial color="#ff6ba8" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      )}
      {children}
    </group>
  );
}

// ── The whole house — theme-driven from a floorplan descriptor. Per-room point
// lights removed for perf; hemisphere + ambient in Room3D light it cheaply. ──
export default function Furniture() {
  const d = useDecorColors();
  const { wall, floor, gardenpot } = d;
  const theme = useStore((s) => s.decor)?.theme || 'modern';
  const fp = getFloorplan(theme);
  const b = fp.bounds;
  const placed = useStore((s) => s.placedFurniture);
  const ready = useStore((s) => s.ready);
  const arrange = useStore((s) => s.arrangeMode);
  const sel = useStore((s) => s.arrangeSel);
  const setSel = useStore((s) => s.setArrangeSel);

  // seed furniture from the floorplan defaults on first run (empty DB)
  useEffect(() => {
    if (!ready || placed.length > 0) return;
    api
      .post('/api/furniture-seed', {
        furniture: fp.furniture.map((it) => ({ kind: it.kind, x: it.at[0], z: it.at[2], rot: it.rot || 0 })),
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, placed.length, theme]);

  const furnList = placed.length
    ? placed.map((p) => ({ kind: p.kind, pos: [p.x, 0, p.z], rot: p.rot, key: `p${p.id}` }))
    : fp.furniture.map((it, i) => ({ kind: it.kind, pos: it.at, rot: it.rot, key: `u${i}` }));

  return (
    <group>
      <Environment theme={theme} />
      <Exterior variant={fp.exterior} palette={fp.palette} bounds={b} />

      {/* tap empty floor to deselect while arranging */}
      {arrange && (
        <mesh position={[0, 0.005, 0.8]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={() => setSel(null)}>
          <planeGeometry args={[22, 22]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* base floor + per-room tints */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[b.halfX * 2, b.halfZ * 2]} />
        <meshStandardMaterial color={floor[1]} roughness={1} />
      </mesh>
      {fp.rooms.map((r) => (
        <mesh key={r.id} position={[r.center[0], 0, r.center[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
          <planeGeometry args={[r.size[0], r.size[1]]} />
          <meshStandardMaterial color={r.floor} roughness={1} />
        </mesh>
      ))}

      {/* walls */}
      {fp.walls.map((w, i) => (
        <Wall key={`w${i}`} a={w.a} b={w.b} color={wall[0]} />
      ))}

      {/* windows */}
      {fp.windows.map((w, i) => (
        <Window key={`win${i}`} position={w.at} rotation={[0, w.rot || 0, 0]} moon={w.moon} />
      ))}

      {/* nav fittings */}
      {fp.fittings.map((f, i) => (
        <group key={`fit${i}`}>{(FITTING[f.role] || (() => null))(f, d)}</group>
      ))}

      {/* decorative furniture (draggable in arrange mode) */}
      {arrange
        ? placed.map((p) => (
            <DraggablePiece
              key={`p${p.id}`}
              position={[p.x, 0, p.z]}
              rot={p.rot}
              bounds={b}
              selected={sel === `f${p.id}`}
              onSelect={() => setSel(`f${p.id}`)}
              onMoved={(x, z) => api.post(`/api/furniture/${p.id}`, { x, z, rot: p.rot }).catch(() => {})}
            >
              {furnPiece(p.kind, [0, 0, 0], 0, d, `c${p.id}`)}
            </DraggablePiece>
          ))
        : furnList.map((f) => furnPiece(f.kind, f.pos, f.rot, d, f.key))}

      {/* mood lights */}
      {fp.mood.map((p, i) => (
        <MoodLight key={`m${i}`} position={p} spread={0.5} />
      ))}

      <Avatars seed={fp.avatars} bounds={b} />
      <GardenArea position={fp.garden} potColors={gardenpot} />
      <DustMotes count={8} />
    </group>
  );
}
