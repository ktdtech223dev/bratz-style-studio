import { Component, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Text } from '@react-three/drei';
import StarMapFallback from './StarMapFallback';
import { starToVec3, backgroundStars, DOME_R } from './starPositions';

// Error boundary: if WebGL is lost or the scene throws, fall back to the 2D
// gradient dome so the page never breaks.
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
    console.warn('StarMap fell back to 2D:', err?.message || err);
  }
  render() {
    if (this.state.failed) return <StarMapFallback {...this.props.fallbackProps} />;
    return this.props.children;
  }
}

// Faint background dust of stars baked into a single Points cloud.
function BackgroundDust() {
  const { positions, sizes } = useMemo(() => {
    const pts = backgroundStars();
    const positions = new Float32Array(pts.length * 3);
    const sizes = new Float32Array(pts.length);
    pts.forEach((p, i) => {
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];
      sizes[i] = p[3];
    });
    return { positions, sizes };
  }, []);

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      // very gentle shimmer of the whole field
      ref.current.material.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        color="#cdd3ff"
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}

// One saved memory-star: a glowing emissive orb that twinkles, with a small
// billboard label. Tapping it lifts the selection up to the page.
function MemoryStar({ star, onSelect, selected }) {
  const pos = useMemo(() => starToVec3(star.x, star.y), [star.x, star.y]);
  const color = star.added_color || '#fde047';
  const coreRef = useRef();
  const glowRef = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tw = 0.78 + Math.sin(t * 1.8 + phase) * 0.22; // twinkle
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = (selected ? 2.6 : 1.7) * tw;
      const s = (selected ? 1.5 : 1) * (0.96 + tw * 0.08);
      coreRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = (selected ? 0.5 : 0.32) * tw;
    }
  });

  return (
    <group position={pos}>
      {/* soft halo */}
      <sprite ref={glowRef} scale={selected ? 1.5 : 1.05}>
        <spriteMaterial color={color} transparent opacity={0.32} depthWrite={false} />
      </sprite>

      {/* glowing core — the tappable hit target */}
      <mesh
        ref={coreRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(star);
        }}
      >
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.7}
          toneMapped={false}
        />
      </mesh>

      {/* floating label, always facing the camera */}
      <Billboard position={[0, 0.32, 0]}>
        <Text
          fontSize={0.16}
          color={selected ? '#ffffff' : '#dfe2ff'}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.006}
          outlineColor="#0c0d24"
          maxWidth={2.4}
          textAlign="center"
        >
          {star.label || 'a little star'}
        </Text>
      </Billboard>
    </group>
  );
}

function Dome() {
  return (
    <mesh>
      {/* inside-out sphere: render the back faces so we sit inside the sky */}
      <sphereGeometry args={[DOME_R + 1.5, 48, 32]} />
      <meshBasicMaterial color="#0c0d24" side={1 /* BackSide */} fog={false} />
    </mesh>
  );
}

function Scene({ stars, onSelect, selectedId }) {
  return (
    <>
      <color attach="background" args={['#0a0b1e']} />
      <ambientLight intensity={0.6} color="#3a3f73" />
      <pointLight position={[0, 0, 0]} intensity={0.4} color="#b8a9e8" distance={20} />

      <Dome />
      <BackgroundDust />

      {/* subtle moon glow near the top of the dome */}
      <mesh position={starToVec3(72, 12)}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial color="#f3eecf" fog={false} />
      </mesh>

      {stars.map((s) => (
        <MemoryStar key={s.id} star={s} onSelect={onSelect} selected={selectedId === s.id} />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom
        // we sit at the centre of the dome looking out
        target={[0, 0.6, 0.001]}
        minDistance={0.1}
        maxDistance={6}
        // full azimuth (it's a sky); allow looking nearly straight up to reach
        // the highest stars, with a gentle clamp before the very nadir
        minPolarAngle={Math.PI * 0.04}
        maxPolarAngle={Math.PI * 0.82}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={-0.45 /* invert so dragging feels like looking around */}
        zoomSpeed={0.6}
      />
    </>
  );
}

// Default export: the lazy-loaded 3D star dome. Camera lives near the centre of
// the dome so orbiting reads as panning your gaze across the night sky.
export default function StarMapScene({ stars = [], onSelect, selectedId, fallbackProps }) {
  return (
    <WebGLBoundary fallbackProps={fallbackProps}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.8, 2.4], fov: 62, near: 0.05, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        <Scene stars={stars} onSelect={onSelect} selectedId={selectedId} />
      </Canvas>
    </WebGLBoundary>
  );
}
