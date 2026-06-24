import { useMemo } from 'react';
import * as THREE from 'three';

// The world around the house — a sky dome, a big ground plane, a foundation
// slab, and themed surroundings — so the house never floats in a void. Driven
// by the active house theme.
const ENV = {
  modern: { ground: '#3b3f4c', sky: '#161b2e', fog: '#161b2e', kind: 'city' },
  forest: { ground: '#2f4a30', sky: '#16241c', fog: '#16241c', kind: 'forest' },
  tuscan: { ground: '#8a6a3e', sky: '#3a2a22', fog: '#3a2a22', kind: 'hills' },
  beach: { ground: '#dcc79c', sky: '#1f3f52', fog: '#274d5e', kind: 'beach' },
  cottage: { ground: '#3f5e3a', sky: '#243341', kind: 'meadow', fog: '#243341' },
  chalet: { ground: '#dde6ee', sky: '#1f2a3c', fog: '#aebccd', kind: 'snow' },
};

function Pine({ position, h = 1.6, snow = false, color = '#2f5d39' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.08, 0.1, 0.4, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.5 + i * h * 0.28, 0]} raycast={() => null}>
          <coneGeometry args={[0.5 - i * 0.12, h * 0.5, 7]} />
          <meshStandardMaterial color={snow ? '#cdd9d0' : color} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Cypress({ position }) {
  return (
    <mesh position={[position[0], 1.0, position[2]]} raycast={() => null}>
      <coneGeometry args={[0.28, 2.4, 8]} />
      <meshStandardMaterial color="#3a5236" roughness={1} flatShading />
    </mesh>
  );
}

function Palm({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} rotation={[0, 0, 0.12]} raycast={() => null}>
        <cylinderGeometry args={[0.08, 0.12, 1.8, 7]} />
        <meshStandardMaterial color="#9c7a4a" roughness={1} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, 1.8, Math.sin(a) * 0.35]} rotation={[0.5, -a, 0]} raycast={() => null}>
            <boxGeometry args={[0.7, 0.03, 0.18]} />
            <meshStandardMaterial color="#3f7a44" roughness={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function Hill({ position, r = 4, c = '#7a5e3a' }) {
  return (
    <mesh position={position} scale={[r, r * 0.4, r]} raycast={() => null}>
      <sphereGeometry args={[1, 16, 10]} />
      <meshStandardMaterial color={c} roughness={1} flatShading />
    </mesh>
  );
}

function Building({ position, h = 4, w = 1.6, c = '#2a3148' }) {
  return (
    <mesh position={[position[0], h / 2, position[2]]} raycast={() => null}>
      <boxGeometry args={[w, h, w]} />
      <meshStandardMaterial color={c} emissive="#aab4ff" emissiveIntensity={0.06} roughness={0.8} />
    </mesh>
  );
}

// deterministic ring of points outside the house
function ring(n, rMin, rMax, seed = 1) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (i * seed) % 1.3;
    const r = rMin + ((i * 2.39 + seed) % 1) * (rMax - rMin);
    return [Math.cos(a) * r, 0, Math.sin(a) * r];
  });
}

function Surroundings({ kind }) {
  if (kind === 'forest') {
    const pts = ring(16, 6.5, 13, 1.1);
    return pts.map((p, i) => <Pine key={i} position={p} h={1.3 + (i % 4) * 0.3} color={i % 2 ? '#2f5d39' : '#27502f'} />);
  }
  if (kind === 'snow') {
    const pts = ring(14, 6.5, 13, 2.3);
    return (
      <group>
        {pts.map((p, i) => <Pine key={i} position={p} h={1.2 + (i % 3) * 0.3} snow />)}
        {ring(8, 5, 10, 3.1).map((p, i) => (
          <mesh key={`m${i}`} position={[p[0], 0.05, p[2]]} scale={[1.2, 0.3, 1.2]} raycast={() => null}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#eef3f8" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === 'hills') {
    return (
      <group>
        <Hill position={[-9, -0.5, -8]} r={5} c="#8a6a3e" />
        <Hill position={[10, -0.8, -6]} r={6} c="#7d5f37" />
        <Hill position={[2, -0.6, -12]} r={5.5} c="#94733f" />
        {ring(7, 6, 11, 1.7).map((p, i) => <Cypress key={i} position={p} />)}
      </group>
    );
  }
  if (kind === 'beach') {
    return (
      <group>
        {/* ocean */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -14]} raycast={() => null}>
          <planeGeometry args={[60, 28]} />
          <meshStandardMaterial color="#2f7fa6" roughness={0.3} metalness={0.1} />
        </mesh>
        {[[-6, 0, 6], [6, 0, 5], [-7, 0, -2], [8, 0, 1]].map((p, i) => <Palm key={i} position={p} />)}
      </group>
    );
  }
  if (kind === 'meadow') {
    const pts = ring(26, 5, 12, 0.7);
    return pts.map((p, i) => (
      <mesh key={i} position={[p[0], 0.08, p[2]]} raycast={() => null}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color={['#ff7fb0', '#fde047', '#ffffff', '#c084fc'][i % 4]} roughness={0.7} />
      </mesh>
    ));
  }
  // city (modern)
  return ring(9, 8, 14, 1.9).map((p, i) => <Building key={i} position={p} h={3 + (i % 4) * 1.5} w={1.3 + (i % 2) * 0.5} />);
}

export default function Environment({ theme = 'modern' }) {
  const e = ENV[theme] || ENV.modern;
  const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: e.sky, side: THREE.BackSide, fog: false }), [e.sky]);
  return (
    <group>
      {/* sky dome */}
      <mesh raycast={() => null} material={skyMat}>
        <sphereGeometry args={[42, 24, 16]} />
      </mesh>
      <fog attach="fog" args={[e.fog || e.sky, 18, 40]} />
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow raycast={() => null}>
        <circleGeometry args={[34, 48]} />
        <meshStandardMaterial color={e.ground} roughness={1} />
      </mesh>
      {/* foundation slab under the house */}
      <mesh position={[0, -0.04, 0.4]} raycast={() => null}>
        <boxGeometry args={[8.2, 0.1, 7.0]} />
        <meshStandardMaterial color="#2a2a30" roughness={1} />
      </mesh>
      <Surroundings kind={e.kind} />
    </group>
  );
}
