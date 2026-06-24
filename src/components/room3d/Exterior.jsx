// Per-theme exterior cladding — foundation plinth, eaves rim, a back-half roof,
// and variant-specific treatment. Primitives only, all raycast disabled, no
// lights. Never covers the open front of the dollhouse (roof only spans the
// back half z∈[-hz,0]).

function Eaves({ hx, hz, y, color }) {
  const o = 0.25;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0, -hz - o / 2]} raycast={() => null}>
        <boxGeometry args={[hx * 2 + o * 2, 0.1, o]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, hz + o / 2]} raycast={() => null}>
        <boxGeometry args={[hx * 2 + o * 2, 0.1, o]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[-hx - o / 2, 0, 0]} raycast={() => null}>
        <boxGeometry args={[o, 0.1, hz * 2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[hx + o / 2, 0, 0]} raycast={() => null}>
        <boxGeometry args={[o, 0.1, hz * 2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Roof({ variant, hx, hz, wallH, roof }) {
  const slope = variant === 'chalet' ? 1.5 : variant === 'cottage' ? 1.1 : variant === 'modern' || variant === 'beach' ? 0.25 : 0.9;
  const depth = hz + 0.3;
  const angle = Math.atan2(slope, depth);
  return (
    <group>
      <mesh position={[0, wallH + slope / 2 + 0.05, -hz / 2 - 0.05]} rotation={[-angle, 0, 0]} raycast={() => null}>
        <boxGeometry args={[hx * 2 + 0.5, 0.12, depth + slope * 0.6]} />
        <meshStandardMaterial color={roof} roughness={0.85} flatShading />
      </mesh>
      {variant === 'chalet' && (
        <mesh position={[0, wallH + slope / 2 + 0.13, -hz / 2 - 0.05]} rotation={[-angle, 0, 0]} raycast={() => null}>
          <boxGeometry args={[hx * 2 + 0.6, 0.06, depth + slope * 0.6]} />
          <meshStandardMaterial color="#eef3f8" roughness={1} />
        </mesh>
      )}
      {variant === 'tuscan' &&
        Array.from({ length: 9 }).map((_, i) => (
          <mesh
            key={i}
            position={[-hx + 0.45 + i * ((hx * 2 - 0.9) / 8), wallH + slope / 2 + 0.12, -hz / 2 - 0.05]}
            rotation={[-angle, 0, 0]}
            raycast={() => null}
          >
            <cylinderGeometry args={[0.07, 0.07, depth + slope * 0.6, 8, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#b5613a" roughness={0.9} />
          </mesh>
        ))}
    </group>
  );
}

function Cladding({ variant, hx, hz, wallH }) {
  if (variant === 'forest') {
    return (
      <group>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.3 + i * 0.45, -hz - 0.07]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
            <cylinderGeometry args={[0.16, 0.16, hx * 2, 8]} />
            <meshStandardMaterial color={i % 2 ? '#5a4030' : '#4f3829'} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  if (variant === 'beach') {
    const posts = [[-hx + 0.4, hz - 0.4], [hx - 0.4, hz - 0.4], [-hx + 0.4, -hz + 0.4], [hx - 0.4, -hz + 0.4], [0, hz - 0.4], [0, -hz + 0.4]];
    return (
      <group>
        {posts.map((p, i) => (
          <mesh key={i} position={[p[0], -0.42, p[1]]} raycast={() => null}>
            <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
            <meshStandardMaterial color="#cbb189" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  if (variant === 'modern') {
    return (
      <mesh position={[0, wallH * 0.5, -hz - 0.07]} raycast={() => null}>
        <boxGeometry args={[hx * 1.2, wallH * 0.8, 0.04]} />
        <meshStandardMaterial color="#a9c7dd" transparent opacity={0.35} roughness={0.1} metalness={0.2} />
      </mesh>
    );
  }
  return null;
}

export default function Exterior({ variant = 'modern', palette = {}, bounds }) {
  const hx = bounds?.halfX ?? 3.7;
  const hz = bounds?.halfZ ?? 2.7;
  const wallH = bounds?.wallH ?? 2.0;
  const roof = palette.roof || '#2a2a30';
  const trim = palette.trim || '#cdbfe6';
  const foundation = palette.foundation || '#2a2a30';

  return (
    <group>
      {/* foundation plinth (slightly larger than footprint) */}
      <mesh position={[0, -0.02, 0]} raycast={() => null}>
        <boxGeometry args={[hx * 2 + 0.3, 0.22, hz * 2 + 0.3]} />
        <meshStandardMaterial color={foundation} roughness={1} />
      </mesh>
      <Eaves hx={hx} hz={hz} y={wallH + 0.03} color={trim} />
      <Roof variant={variant} hx={hx} hz={hz} wallH={wallH} roof={roof} />
      <Cladding variant={variant} hx={hx} hz={hz} wallH={wallH} />
    </group>
  );
}
