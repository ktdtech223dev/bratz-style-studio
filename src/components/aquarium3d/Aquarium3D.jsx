import { Component, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import AquariumSprite from '../AquariumSprite';

// Error boundary: if WebGL is lost or the scene throws, fall back to the 2D
// AquariumSprite so the page never breaks.
class WebGLBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn('Aquarium3D fell back to 2D:', err?.message || err);
  }
  render() {
    if (this.state.failed) return <AquariumSprite {...this.props.fallbackProps} />;
    return this.props.children;
  }
}

// Tank inner bounds (the swimmable volume). The glass sits just outside these.
const TANK_W = 3.0; // x: -1.5 .. 1.5
const TANK_D = 1.6; // z: -0.8 .. 0.8
const TANK_H = 1.6; // y:  0.0 .. 1.6 (floor at y=0, gravel ~0.15)
const GRAVEL_Y = 0.16;
const SWIM_MIN_Y = GRAVEL_Y + 0.18;
const SWIM_MAX_Y = TANK_H - 0.22;

// A single low-poly fish: cone body + tail fin, bobbing along a per-index orbit.
// `feedRef` carries a 0..1 dart progress; when feeding, fish converge toward a
// food target near the surface center.
function Fish({ index, count, color, size, feedRef, foodTarget }) {
  const group = useRef();
  // Deterministic per-fish path params so the same count always looks varied.
  const p = useMemo(() => {
    const a = index * 2.39996; // golden angle for spread
    const rx = 0.7 + ((index * 0.37) % 1) * 0.55;
    const rz = 0.35 + ((index * 0.53) % 1) * 0.28;
    const yBase = SWIM_MIN_Y + ((index * 0.61) % 1) * (SWIM_MAX_Y - SWIM_MIN_Y);
    const speed = 0.35 + ((index * 0.29) % 1) * 0.4;
    const dir = index % 2 === 0 ? 1 : -1;
    const yAmp = 0.08 + ((index * 0.41) % 1) * 0.16;
    return { phase: a, rx, rz, yBase, speed: speed * dir, yAmp, ySpeed: 0.6 + (index % 3) * 0.3 };
  }, [index]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const ang = p.phase + t * p.speed;
    // Idle elliptical orbit position
    const ix = Math.cos(ang) * p.rx;
    const iz = Math.sin(ang) * p.rz;
    const iy = p.yBase + Math.sin(t * p.ySpeed + p.phase) * p.yAmp;

    const feed = feedRef.current; // 0..1
    let x = ix;
    let y = iy;
    let z = iz;
    if (feed > 0 && foodTarget) {
      // Each fish targets a slightly offset point so they cluster, not stack.
      const ox = ((index % 3) - 1) * 0.18;
      const oz = ((index % 2) - 0.5) * 0.3;
      const tx = foodTarget[0] + ox;
      const ty = foodTarget[1];
      const tz = foodTarget[2] + oz;
      const e = feed * feed * (3 - 2 * feed); // smoothstep ease
      x = THREE.MathUtils.lerp(ix, tx, e);
      y = THREE.MathUtils.lerp(iy, ty, e);
      z = THREE.MathUtils.lerp(iz, tz, e);
    }

    // Orient toward direction of travel
    const prev = g.position;
    const dx = x - prev.x;
    const dz = z - prev.z;
    if (Math.abs(dx) > 1e-4 || Math.abs(dz) > 1e-4) {
      const targetRot = Math.atan2(dx, dz);
      // smooth rotate
      let cur = g.rotation.y;
      let diff = targetRot - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y = cur + diff * 0.15;
    }
    g.position.set(x, y, z);
    // gentle tail wag via whole-body roll
    g.rotation.z = Math.sin(t * 6 + p.phase) * 0.12;
  });

  return (
    <group ref={group}>
      {/* body — cone pointing +Z (forward) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[size * 0.45, size * 1.5, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* tail fin — flat triangle at the back (-Z) */}
      <mesh position={[0, 0, -size * 0.85]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[size * 0.5, size * 0.7, 4]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* eyes */}
      <mesh position={[size * 0.25, size * 0.12, size * 0.45]}>
        <sphereGeometry args={[size * 0.12, 8, 8]} />
        <meshStandardMaterial color="#0a0a14" />
      </mesh>
      <mesh position={[-size * 0.25, size * 0.12, size * 0.45]}>
        <sphereGeometry args={[size * 0.12, 8, 8]} />
        <meshStandardMaterial color="#0a0a14" />
      </mesh>
    </group>
  );
}

// A column of rising bubbles that loops from the gravel to the surface.
function BubbleColumn({ x, z, seed }) {
  const ref = useRef();
  const count = 6;
  const offsets = useMemo(
    () => Array.from({ length: count }, (_, i) => (i / count + (seed % 1)) % 1),
    [seed]
  );
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      const speed = 0.25 + (i % 3) * 0.05;
      let f = (offsets[i] + t * speed) % 1;
      c.position.y = GRAVEL_Y + f * (TANK_H - GRAVEL_Y - 0.1);
      c.position.x = Math.sin(t * 2 + i) * 0.04;
      c.material.opacity = 0.15 + (1 - f) * 0.35;
      const s = 0.02 + (i % 3) * 0.012;
      c.scale.setScalar(s);
    });
  });
  return (
    <group ref={ref} position={[x, 0, z]}>
      {offsets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// Animated caustics: a softly pulsing emissive plane just under the surface plus
// the water tint, which greens up as cleanliness drops (algae).
function Water({ cleanliness }) {
  const matRef = useRef();
  const causticRef = useRef();
  const algae = 1 - Math.max(0, Math.min(100, cleanliness)) / 100;

  // base clear-water blue -> murky green blend
  const tint = useMemo(() => {
    const clear = new THREE.Color('#2f9fd6');
    const green = new THREE.Color('#5d7a2e');
    return clear.clone().lerp(green, algae * 0.85);
  }, [algae]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (causticRef.current) {
      causticRef.current.material.opacity = (0.12 + Math.sin(t * 1.3) * 0.05) * (1 - algae * 0.6);
    }
    if (matRef.current) {
      matRef.current.opacity = 0.32 + algae * 0.22;
    }
  });

  return (
    <group>
      {/* water volume — subtle transparent tinted box filling the tank */}
      <mesh position={[0, GRAVEL_Y + (TANK_H - GRAVEL_Y) / 2, 0]}>
        <boxGeometry args={[TANK_W - 0.04, TANK_H - GRAVEL_Y - 0.02, TANK_D - 0.04]} />
        <meshStandardMaterial
          ref={matRef}
          color={tint}
          transparent
          opacity={0.34}
          roughness={0.1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      {/* caustics — emissive shimmer plane near the surface */}
      <mesh
        ref={causticRef}
        position={[0, TANK_H - 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[TANK_W - 0.1, TANK_D - 0.1]} />
        <meshStandardMaterial
          color="#bdecff"
          emissive="#bdecff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Glass tank shell: thin transparent walls + a darker rim.
function GlassTank() {
  return (
    <group>
      {/* outer glass box (transparent) */}
      <mesh position={[0, TANK_H / 2, 0]}>
        <boxGeometry args={[TANK_W + 0.06, TANK_H + 0.04, TANK_D + 0.06]} />
        <meshPhysicalMaterial
          color="#cfe9f2"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.6}
          thickness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* top rim */}
      <RoundedBox
        args={[TANK_W + 0.12, 0.08, TANK_D + 0.12]}
        radius={0.03}
        smoothness={2}
        position={[0, TANK_H + 0.02, 0]}
      >
        <meshStandardMaterial color="#1d2540" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      {/* bottom rim / base */}
      <RoundedBox
        args={[TANK_W + 0.12, 0.1, TANK_D + 0.12]}
        radius={0.03}
        smoothness={2}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#1d2540" roughness={0.6} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

// Sandy gravel floor + scattered pebbles.
function Gravel() {
  const pebbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: (((i * 0.53) % 1) - 0.5) * (TANK_W - 0.4),
        z: (((i * 0.37) % 1) - 0.5) * (TANK_D - 0.4),
        s: 0.06 + ((i * 0.29) % 1) * 0.06,
        c: ['#c9ad6e', '#b79a5c', '#d8c184', '#bfa463', '#cdb274'][i % 5],
      })),
    []
  );
  return (
    <group>
      <mesh position={[0, GRAVEL_Y / 2, 0]} receiveShadow>
        <boxGeometry args={[TANK_W - 0.02, GRAVEL_Y, TANK_D - 0.02]} />
        <meshStandardMaterial color="#d8c184" roughness={1} />
      </mesh>
      {pebbles.map((p, i) => (
        <mesh key={i} position={[p.x, GRAVEL_Y + p.s * 0.3, p.z]} castShadow>
          <sphereGeometry args={[p.s, 8, 6]} />
          <meshStandardMaterial color={p.c} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// A swaying plant frond made of stacked tapering segments.
function Plant({ position, color, height, sway }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + sway) * 0.18;
    }
  });
  const segs = 5;
  return (
    <group position={position}>
      <group ref={ref}>
        {Array.from({ length: segs }, (_, i) => {
          const segH = height / segs;
          const r = 0.05 * (1 - i / (segs + 1));
          return (
            <mesh key={i} position={[Math.sin(i) * 0.04, segH * (i + 0.5), 0]} castShadow>
              <cylinderGeometry args={[r * 0.7, r, segH, 6]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// A chunky coral cluster from spheres + a couple of arms.
function Coral({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.12, 0.26, 0.05]} rotation={[0.3, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.32, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[-0.1, 0.24, -0.04]} rotation={[-0.2, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 0.28, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.0, 0.34, 0.0]} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
}

// Falling food pellets that descend toward the food target while feeding.
function FoodPellets({ feedRef, foodTarget }) {
  const ref = useRef();
  const pellets = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: (((i * 0.41) % 1) - 0.5) * 0.7,
        z: (((i * 0.27) % 1) - 0.5) * 0.4,
        delay: (i / 10) * 0.5,
      })),
    []
  );
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const feed = feedRef.current; // 0..1
    g.visible = feed > 0;
    if (feed <= 0) return;
    g.children.forEach((c, i) => {
      const p = pellets[i];
      const local = Math.max(0, Math.min(1, (feed - p.delay) / (1 - p.delay || 1)));
      const startY = TANK_H - 0.12;
      c.position.x = foodTarget[0] + p.x;
      c.position.z = foodTarget[2] + p.z;
      c.position.y = THREE.MathUtils.lerp(startY, foodTarget[1], local);
      c.visible = local > 0;
    });
  });
  return (
    <group ref={ref} visible={false}>
      {pellets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#e0892f" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ cleanliness, fish, feedRef, foodTarget }) {
  // Per-fish color palette + size, varied deterministically.
  const PALETTE = ['#ff8a3d', '#ffd23d', '#ff5d8f', '#4dd2ff', '#9d6bff', '#5dff9b', '#ff6b6b', '#3dffe0'];
  const fishList = useMemo(
    () =>
      Array.from({ length: Math.max(0, fish) }, (_, i) => ({
        color: PALETTE[i % PALETTE.length],
        size: 0.1 + ((i * 0.37) % 1) * 0.06,
      })),
    [fish]
  );

  return (
    <group position={[0, -0.8, 0]}>
      <GlassTank />
      <Gravel />
      <Water cleanliness={cleanliness} />

      {/* plants & coral around the back edges */}
      <Plant position={[-1.15, GRAVEL_Y, -0.45]} color="#2f9e54" height={0.95} sway={0} />
      <Plant position={[-0.85, GRAVEL_Y, -0.5]} color="#3cba66" height={0.7} sway={1.2} />
      <Plant position={[1.15, GRAVEL_Y, 0.4]} color="#2f9e54" height={0.85} sway={2.1} />
      <Plant position={[0.7, GRAVEL_Y, -0.5]} color="#46c777" height={0.6} sway={3.3} />
      <Coral position={[1.0, GRAVEL_Y, -0.4]} color="#ff7eae" />
      <Coral position={[-1.2, GRAVEL_Y, 0.4]} color="#ff9d57" />

      <BubbleColumn x={-1.2} z={0.45} seed={0.2} />
      <BubbleColumn x={1.1} z={-0.4} seed={0.7} />

      <FoodPellets feedRef={feedRef} foodTarget={foodTarget} />

      {fishList.map((f, i) => (
        <Fish
          key={i}
          index={i}
          count={fishList.length}
          color={f.color}
          size={f.size}
          feedRef={feedRef}
          foodTarget={foodTarget}
        />
      ))}
    </group>
  );
}

export default function Aquarium3D({ cleanliness = 100, fish = 2, feedRef, fallbackProps }) {
  // Scene-local target where fish & pellets converge while feeding (mid-tank).
  const foodTarget = useMemo(() => [0, GRAVEL_Y + 0.5, 0], []);
  return (
    <WebGLBoundary fallbackProps={fallbackProps}>
      <div className="aspect-square w-full">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 1.2, 4.2], fov: 42, near: 0.1, far: 40 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
          }}
        >
          <color attach="background" args={['#0c1230']} />
          <fog attach="fog" args={['#0c1230', 8, 18]} />

          <ambientLight intensity={0.55} color="#4a5fa8" />
          <directionalLight
            position={[2, 5, 3]}
            intensity={1.0}
            color="#bcd4ff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
            shadow-bias={-0.0005}
          />
          {/* warm fill from the front for the fish */}
          <pointLight position={[0, 1.5, 3]} intensity={0.4} color="#ffe6b0" />

          <Scene
            cleanliness={cleanliness}
            fish={fish}
            feedRef={feedRef}
            foodTarget={foodTarget}
          />

          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={2.4}
            maxDistance={7}
            minPolarAngle={Math.PI * 0.12}
            maxPolarAngle={Math.PI * 0.5}
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.8}
            rotateSpeed={0.7}
          />
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}
