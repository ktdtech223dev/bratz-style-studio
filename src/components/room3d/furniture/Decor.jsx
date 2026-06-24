import { RoundedBox } from '@react-three/drei';
import { WOOD, WOOD_DARK, METAL, lighten, darken, nudgeHue, paletteFrom } from './_helpers';

// ── Bookshelf: tall ~0.9w x 0.3d x 1.4h with colorful book rows ──────────────
export function Bookshelf({ color = WOOD, ...props }) {
  const body = color;
  const back = darken(color, 0.12);
  const W = 0.9;
  const H = 1.4;
  const D = 0.3;
  const shelves = 4; // shelf decks (=> rows above each)
  const books = paletteFrom(color, 7);

  return (
    <group {...props}>
      {/* side panels */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * W) / 2 - s * 0.02, H / 2, 0]} castShadow receiveShadow raycast={() => null}>
          <boxGeometry args={[0.04, H, D]} />
          <meshStandardMaterial color={body} roughness={0.82} />
        </mesh>
      ))}
      {/* back panel */}
      <mesh position={[0, H / 2, -D / 2 + 0.01]} raycast={() => null}>
        <boxGeometry args={[W - 0.04, H, 0.02]} />
        <meshStandardMaterial color={back} roughness={0.9} />
      </mesh>
      {/* top + bottom + inner shelves */}
      {Array.from({ length: shelves + 1 }).map((_, i) => {
        const y = 0.04 + (i * (H - 0.08)) / shelves;
        return (
          <mesh key={i} position={[0, y, 0]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[W - 0.04, 0.04, D]} />
            <meshStandardMaterial color={lighten(color, 0.04)} roughness={0.82} />
          </mesh>
        );
      })}

      {/* book rows — one row sitting on each lower shelf */}
      {Array.from({ length: shelves }).map((_, row) => {
        const shelfY = 0.06 + (row * (H - 0.08)) / shelves;
        const count = 9;
        return Array.from({ length: count }).map((__, i) => {
          const bw = (W - 0.14) / count;
          const x = -W / 2 + 0.07 + bw / 2 + i * bw;
          const c = books[(i + row) % books.length];
          const bh = 0.18 + ((i + row) % 3) * 0.035;
          return (
            <mesh key={`${row}-${i}`} position={[x, shelfY + bh / 2, 0]} castShadow raycast={() => null}>
              <boxGeometry args={[bw - 0.01, bh, D - 0.08]} />
              <meshStandardMaterial color={c} roughness={0.7} />
            </mesh>
          );
        });
      })}
    </group>
  );
}

// ── FloorLamp: pole + shade with a soft pointLight at the shade ──────────────
export function FloorLamp({ color = '#f5d9a8', ...props }) {
  const shade = color;
  const pole = METAL;

  return (
    <group {...props}>
      {/* weighted base */}
      <mesh position={[0, 0.03, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.13, 0.15, 0.06, 20]} />
        <meshStandardMaterial color={darken(WOOD_DARK, 0.0)} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* pole */}
      <mesh position={[0, 0.7, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.016, 0.018, 1.34, 10]} />
        <meshStandardMaterial color={pole} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* shade */}
      <mesh position={[0, 1.4, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.16, 0.22, 0.26, 20, 1, true]} />
        <meshStandardMaterial color={shade} emissive={shade} emissiveIntensity={0.5} roughness={0.6} side={2} />
      </mesh>
      {/* shade top cap (dim) */}
      <mesh position={[0, 1.53, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.16, 0.16, 0.01, 20]} />
        <meshStandardMaterial color={darken(color, 0.1)} roughness={0.7} />
      </mesh>
      {/* warm glow */}
      <pointLight position={[0, 1.36, 0]} color={lighten(color, 0.1)} intensity={1.1} distance={3.0} decay={2} />
    </group>
  );
}

// ── AreaRug: flat rounded rug, ~1.6 x 1.1, y≈0.012 ───────────────────────────
export function AreaRug({ color = '#7a6ab0', ...props }) {
  const main = color;
  const border = nudgeHue(color, 20, -0.1);
  const inner = lighten(color, 0.12);

  return (
    <group {...props}>
      {/* outer rug */}
      <RoundedBox args={[1.6, 0.012, 1.1]} radius={0.08} smoothness={3} position={[0, 0.006, 0]} receiveShadow raycast={() => null}>
        <meshStandardMaterial color={border} roughness={1} />
      </RoundedBox>
      {/* inner field */}
      <RoundedBox args={[1.42, 0.013, 0.92]} radius={0.06} smoothness={3} position={[0, 0.0075, 0]} raycast={() => null}>
        <meshStandardMaterial color={main} roughness={1} />
      </RoundedBox>
      {/* center medallion */}
      <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.22, 0.34, 32]} />
        <meshStandardMaterial color={inner} roughness={1} side={2} />
      </mesh>
      <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.12, 28]} />
        <meshStandardMaterial color={inner} roughness={1} />
      </mesh>
    </group>
  );
}

// ── CatCollar: small band ~0.12 diameter to sit on a cat's neck ──────────────
// Tube radius is tiny so it reads as a collar; a little tag dangles in front.
export function CatCollar({ color = '#ff6ba8', ...props }) {
  const band = color;
  const tag = '#fde047';

  return (
    <group {...props}>
      {/* the band — torus axis along y so the ring lies around the neck */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow raycast={() => null}>
        <torusGeometry args={[0.06, 0.012, 10, 24]} />
        <meshStandardMaterial color={band} roughness={0.6} />
      </mesh>
      {/* little buckle */}
      <mesh position={[0, 0.0, 0.06]} raycast={() => null}>
        <boxGeometry args={[0.022, 0.018, 0.012]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* hanging tag */}
      <mesh position={[0, -0.055, 0.055]} raycast={() => null}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color={tag} emissive={tag} emissiveIntensity={0.25} metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}
