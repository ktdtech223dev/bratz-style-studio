import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useDecorColors from './useDecorColors';

// A low-poly sleeping cat curled in the armchair, built from primitives.
// Colors come from the live decor (body / face / eye). Gentle breathing via
// useFrame.
export default function Cat(props) {
  const { cat } = useDecorColors();
  const ref = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const breathe = 1 + Math.sin(t * 1.6) * 0.03;
      ref.current.scale.set(1, breathe, 1);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.5) * 0.06;
    }
  });

  return (
    <group {...props}>
      {/* curled body */}
      <mesh ref={ref} position={[0, 0.13, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={cat.body} roughness={0.85} flatShading />
      </mesh>

      {/* tail wrapping around */}
      <mesh position={[0.17, 0.1, 0.08]} rotation={[0, 0, 0.6]} castShadow>
        <capsuleGeometry args={[0.045, 0.22, 4, 8]} />
        <meshStandardMaterial color={cat.body} roughness={0.85} flatShading />
      </mesh>

      {/* head */}
      <group ref={headRef} position={[-0.12, 0.2, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={cat.face} roughness={0.85} flatShading />
        </mesh>
        {/* ears */}
        <mesh position={[-0.07, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
          <coneGeometry args={[0.05, 0.09, 4]} />
          <meshStandardMaterial color={cat.body} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.07, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
          <coneGeometry args={[0.05, 0.09, 4]} />
          <meshStandardMaterial color={cat.body} roughness={0.85} flatShading />
        </mesh>
        {/* eyes (slightly emissive so they catch the light, half-closed look) */}
        <mesh position={[-0.045, 0.01, 0.1]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={cat.eye} emissive={cat.eye} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.045, 0.01, 0.1]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={cat.eye} emissive={cat.eye} emissiveIntensity={0.5} />
        </mesh>
        {/* nose */}
        <mesh position={[0, -0.03, 0.11]}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial color="#f5a3c7" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
