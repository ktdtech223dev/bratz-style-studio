import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const NEUTRAL = '#b8a9e8'; // lavender fallback when a user has no mood yet

// A single glowing mood orb hanging above the bed. Its emissive color + the
// co-located pointLight tint the room with the user's mood color. Color and
// light intensity lerp smoothly in useFrame so a live 'mood:update' fades in.
// Tapping navigates to /mood.
function Orb({ color, position }) {
  const nav = useNavigate();
  const matRef = useRef();
  const lightRef = useRef();
  const orbRef = useRef();
  const target = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) {
      matRef.current.emissive.lerp(target, 0.06);
      matRef.current.color.lerp(target, 0.06);
    }
    if (lightRef.current) {
      // subtle pulse so the room feels alive; lerp the base too
      const pulse = 0.55 + Math.sin(t * 1.4 + position[0]) * 0.12;
      lightRef.current.color.lerp(target, 0.06);
      lightRef.current.intensity += (pulse - lightRef.current.intensity) * 0.05;
    }
    if (orbRef.current) {
      orbRef.current.position.y = position[1] + Math.sin(t * 0.9 + position[0]) * 0.04;
    }
  });

  return (
    <group
      ref={orbRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        nav('/mood');
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      {/* string */}
      <mesh position={[0, 0.28, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.004, 0.004, 0.5, 4]} />
        <meshStandardMaterial color="#4a3f70" />
      </mesh>
      {/* glowing orb */}
      <mesh>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color={NEUTRAL}
          emissive={NEUTRAL}
          emissiveIntensity={1.4}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* soft halo */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial color={NEUTRAL} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* the light that tints the room */}
      <pointLight ref={lightRef} color={NEUTRAL} intensity={0.55} distance={4.5} decay={2} />
    </group>
  );
}

// Renders one orb for me + one for partner. Each shows that user's current mood
// color (moods[userId]?.color), tinting the room. `position` places the pair and
// `spread` sets how far apart the two orbs hang.
export default function MoodLight({ position = [0, 1.95, -1.2], spread = 0.55 }) {
  const moods = useStore((s) => s.moods);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);

  const myColor = (me && moods?.[me.id]?.color) || NEUTRAL;
  const partnerColor = (partner && moods?.[partner.id]?.color) || NEUTRAL;

  return (
    <group position={position}>
      <Orb color={myColor} position={[-spread, 0, 0]} />
      <Orb color={partnerColor} position={[spread, 0, 0]} />
    </group>
  );
}
