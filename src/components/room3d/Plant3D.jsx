import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// A reusable low-poly potted plant built from primitives only.
// props:
//   stage     0 (sprout) → 4 (full) — controls trunk height + foliage count/size
//   potColors [top, bottom] gradient pair (top is used as the pot material color)
//   species   optional key to tweak foliage color/shape (used by the garden)
//   sway      enable gentle idle sway (default true)
//
// Used in the room (reads useStore plant.stage upstream), on the Plant page, and
// in the garden via GardenPlantSprite.

const SPECIES_LOOK = {
  monstera: { leaf: '#4caf50', leaf2: '#3d8b40', shape: 'round' },
  cactus: { leaf: '#5fa463', leaf2: '#4a8350', shape: 'column' },
  sunflower: { leaf: '#6bbf4a', leaf2: '#4f9a36', shape: 'round', bloom: '#fbbf24' },
  bonsai: { leaf: '#6bbf6b', leaf2: '#4f9a4f', shape: 'round' },
  succulent: { leaf: '#7ac77a', leaf2: '#5aa35a', shape: 'rosette' },
  bamboo: { leaf: '#7bc96f', leaf2: '#5aa84f', shape: 'column' },
  rose: { leaf: '#5aa35a', leaf2: '#458045', shape: 'round', bloom: '#f43f6b' },
  tulip: { leaf: '#6bbf6b', leaf2: '#4f9a4f', shape: 'round', bloom: '#ff7fb0' },
};

export default function Plant3D({
  stage = 2,
  potColors,
  species,
  sway = true,
  ...groupProps
}) {
  const s = Math.max(0, Math.min(4, stage));
  const potTop = potColors?.[0] || '#ff9fc4';
  const look = SPECIES_LOOK[species] || SPECIES_LOOK.bonsai;

  const ref = useRef();
  useFrame((state) => {
    if (!sway || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.04;
    ref.current.rotation.x = Math.cos(t * 0.8) * 0.02;
  });

  // Trunk grows with stage. Foliage blobs are placed deterministically so the
  // plant looks the same every render.
  const trunkH = 0.18 + s * 0.16;
  const trunkR = 0.04 + s * 0.012;

  const blobs = useMemo(() => {
    const count = look.shape === 'column' ? 0 : 1 + s; // sprout has 1, full has 5
    const baseY = trunkH;
    const out = [];
    if (look.shape === 'column') {
      // cactus / bamboo: stacked segments instead of a canopy
      const segs = 1 + s;
      for (let i = 0; i < segs; i++) {
        out.push({
          pos: [0, 0.12 + i * (0.16 + s * 0.02), 0],
          r: 0.1 + s * 0.012,
          column: true,
        });
      }
      return out;
    }
    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(1, count)) * Math.PI * 2 + i * 1.3;
      const spread = i === 0 ? 0 : 0.1 + s * 0.03;
      const r = (i === 0 ? 0.16 : 0.1) + s * 0.03;
      out.push({
        pos: [
          Math.cos(angle) * spread,
          baseY + (i === 0 ? 0.06 + s * 0.03 : 0.02 + (i % 2) * 0.05),
          Math.sin(angle) * spread * 0.6,
        ],
        r,
      });
    }
    return out;
  }, [s, look.shape, trunkH]);

  return (
    <group {...groupProps}>
      <group ref={ref}>
        {/* soil mound */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.21, 0.21, 0.04, 16]} />
          <meshStandardMaterial color="#3a2e22" roughness={1} />
        </mesh>

        {/* trunk (hidden for column species, which stack segments) */}
        {look.shape !== 'column' && (
          <mesh position={[0, trunkH / 2 + 0.03, 0]} castShadow>
            <cylinderGeometry args={[trunkR * 0.7, trunkR, trunkH, 8]} />
            <meshStandardMaterial color="#6b4f33" roughness={0.9} />
          </mesh>
        )}

        {/* foliage */}
        {blobs.map((b, i) => (
          <mesh key={i} position={b.pos} castShadow>
            {b.column ? (
              <capsuleGeometry args={[b.r, 0.14, 4, 8]} />
            ) : (
              <sphereGeometry args={[b.r, 12, 12]} />
            )}
            <meshStandardMaterial
              color={i % 2 === 0 ? look.leaf : look.leaf2}
              roughness={0.7}
              flatShading
            />
          </mesh>
        ))}

        {/* blossoms for full-grown blooming species */}
        {look.bloom && s >= 3 &&
          [0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={`b${i}`}
                position={[
                  Math.cos(a) * (0.12 + s * 0.02),
                  trunkH + 0.1 + (i % 2) * 0.05,
                  Math.sin(a) * 0.08,
                ]}
                castShadow
              >
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color={look.bloom} emissive={look.bloom} emissiveIntensity={0.25} roughness={0.5} />
              </mesh>
            );
          })}
      </group>

      {/* pot (does not sway) */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.26, 16]} />
        <meshStandardMaterial color={potTop} roughness={0.55} />
      </mesh>
      {/* pot rim */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.04, 16]} />
        <meshStandardMaterial color={potTop} roughness={0.45} />
      </mesh>
    </group>
  );
}
