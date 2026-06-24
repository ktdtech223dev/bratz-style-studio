import { RoundedBox } from '@react-three/drei';
import { WOOD, WOOD_DARK, METAL, lighten, darken, muted, nudgeHue } from './_helpers';

// ── Sofa: 3-seater, ~1.5w x 0.7d x 0.7h ──────────────────────────────────────
// style: 'modern' (low, boxy, metal legs) | 'classic' (rolled arms, wood feet,
// tufted cushions) | 'loveseat' (narrower 2-seater, taller back).
export function Sofa({ color = '#7a6ab0', style = 'modern', ...props }) {
  const body = color;
  const cushion = lighten(color, 0.1);
  const shadow = darken(color, 0.12);

  const isLove = style === 'loveseat';
  const isClassic = style === 'classic';
  const W = isLove ? 1.05 : 1.5; // overall width
  const seatW = W - 0.34; // between the arms
  const backH = isClassic ? 0.6 : isLove ? 0.6 : 0.48;
  const armH = isClassic ? 0.42 : 0.34;
  const seats = isLove ? 2 : 3;

  return (
    <group {...props}>
      {/* base / seat block */}
      <RoundedBox args={[W, 0.26, 0.66]} radius={0.06} smoothness={3} position={[0, 0.26, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={shadow} roughness={0.95} />
      </RoundedBox>

      {/* backrest */}
      <RoundedBox
        args={[W, backH, 0.16]}
        radius={isClassic ? 0.1 : 0.05}
        smoothness={3}
        position={[0, 0.4 + backH / 2 - 0.02, -0.25]}
        castShadow
      >
        <meshStandardMaterial color={body} roughness={0.92} />
      </RoundedBox>

      {/* arms */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.16, armH, 0.66]}
          radius={isClassic ? 0.08 : 0.04}
          smoothness={3}
          position={[(s * (W - 0.16)) / 2, 0.4 + armH / 2 - 0.06, 0]}
          castShadow
        >
          <meshStandardMaterial color={body} roughness={0.92} />
        </RoundedBox>
      ))}

      {/* seat cushions */}
      {Array.from({ length: seats }).map((_, i) => {
        const cw = seatW / seats;
        const x = -seatW / 2 + cw / 2 + i * cw;
        return (
          <RoundedBox
            key={`s${i}`}
            args={[cw - 0.03, 0.12, 0.56]}
            radius={0.05}
            smoothness={3}
            position={[x, 0.45, 0.03]}
            castShadow
          >
            <meshStandardMaterial color={cushion} roughness={0.9} />
          </RoundedBox>
        );
      })}

      {/* back cushions (skip on modern for a sleeker look) */}
      {!isClassic &&
        Array.from({ length: seats }).map((_, i) => {
          const cw = seatW / seats;
          const x = -seatW / 2 + cw / 2 + i * cw;
          return (
            <RoundedBox
              key={`b${i}`}
              args={[cw - 0.04, backH - 0.14, 0.1]}
              radius={0.05}
              smoothness={3}
              position={[x, 0.4 + backH / 2, -0.21]}
              castShadow
            >
              <meshStandardMaterial color={cushion} roughness={0.9} />
            </RoundedBox>
          );
        })}

      {/* classic: tufted button accents on the back */}
      {isClassic &&
        Array.from({ length: seats * 2 }).map((_, i) => {
          const col = i % seats;
          const row = Math.floor(i / seats);
          const cw = seatW / seats;
          const x = -seatW / 2 + cw / 2 + col * cw;
          return (
            <mesh key={`t${i}`} position={[x, 0.5 + row * 0.18, -0.18]} raycast={() => null}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color={muted(color, -0.15)} roughness={0.8} />
            </mesh>
          );
        })}

      {/* legs: modern = slanted metal, classic = wood feet, loveseat = short metal */}
      {[
        [-(W / 2 - 0.12), 0.24],
        [W / 2 - 0.12, 0.24],
        [-(W / 2 - 0.12), -0.24],
        [W / 2 - 0.12, -0.24],
      ].map((p, i) =>
        isClassic ? (
          <mesh key={i} position={[p[0], 0.06, p[1]]} raycast={() => null}>
            <cylinderGeometry args={[0.04, 0.03, 0.12, 8]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
          </mesh>
        ) : (
          <mesh key={i} position={[p[0], 0.065, p[1]]} rotation={[0, 0, p[0] > 0 ? 0.12 : -0.12]} raycast={() => null}>
            <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
          </mesh>
        ),
      )}
    </group>
  );
}

// ── CoffeeTableF: ~0.9w x 0.5d x 0.34h ───────────────────────────────────────
// style: 'modern' (glass-ish top + metal X frame) | 'classic'/'wood' (chunky
// wood top + turned legs + lower shelf).
export function CoffeeTableF({ color = WOOD, style = 'modern', ...props }) {
  const isModern = style === 'modern';
  const top = isModern ? lighten(color, 0.06) : color;

  return (
    <group {...props}>
      {/* table top */}
      <RoundedBox args={[0.9, 0.06, 0.5]} radius={0.03} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color={top}
          roughness={isModern ? 0.2 : 0.8}
          metalness={isModern ? 0.1 : 0}
          transparent={isModern}
          opacity={isModern ? 0.78 : 1}
        />
      </RoundedBox>

      {isModern ? (
        <>
          {/* metal cross frame */}
          {[0.4, -0.4].map((z, i) => (
            <mesh key={i} position={[0, 0.17, z]} rotation={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[0.74, 0.025, 0.025]} />
              <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {[
            [-0.36, 0.21],
            [0.36, 0.21],
            [-0.36, -0.21],
            [0.36, -0.21],
          ].map((p, i) => (
            <mesh key={`l${i}`} position={[p[0], 0.16, p[1]]} raycast={() => null}>
              <cylinderGeometry args={[0.018, 0.018, 0.32, 8]} />
              <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* chunky wood legs */}
          {[
            [-0.38, 0.2],
            [0.38, 0.2],
            [-0.38, -0.2],
            [0.38, -0.2],
          ].map((p, i) => (
            <mesh key={i} position={[p[0], 0.15, p[1]]} raycast={() => null}>
              <cylinderGeometry args={[0.035, 0.03, 0.3, 10]} />
              <meshStandardMaterial color={darken(color, 0.1)} roughness={0.8} />
            </mesh>
          ))}
          {/* lower shelf */}
          <RoundedBox args={[0.78, 0.04, 0.4]} radius={0.02} smoothness={2} position={[0, 0.08, 0]} castShadow raycast={() => null}>
            <meshStandardMaterial color={darken(color, 0.06)} roughness={0.85} />
          </RoundedBox>
        </>
      )}
    </group>
  );
}

// ── DiningSet: small round table + stools ────────────────────────────────────
export function DiningSet({ color = WOOD, ...props }) {
  const wood = color;
  const seat = nudgeHue(color, 24, 0.08);
  const stools = [0, 1, 2, 3];

  return (
    <group {...props}>
      {/* table top */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 28]} />
        <meshStandardMaterial color={wood} roughness={0.7} />
      </mesh>
      {/* central pillar */}
      <mesh position={[0, 0.38, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.06, 0.07, 0.66, 12]} />
        <meshStandardMaterial color={darken(color, 0.12)} roughness={0.8} />
      </mesh>
      {/* foot */}
      <mesh position={[0, 0.04, 0]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.22, 0.26, 0.06, 20]} />
        <meshStandardMaterial color={darken(color, 0.16)} roughness={0.8} />
      </mesh>

      {/* stools around the table */}
      {stools.map((i) => {
        const a = (i / stools.length) * Math.PI * 2 + Math.PI / 4;
        const r = 0.62;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.44, 0]} castShadow raycast={() => null}>
              <cylinderGeometry args={[0.13, 0.13, 0.05, 18]} />
              <meshStandardMaterial color={seat} roughness={0.8} />
            </mesh>
            {[0, 1, 2].map((l) => {
              const la = (l / 3) * Math.PI * 2;
              return (
                <mesh
                  key={l}
                  position={[Math.cos(la) * 0.08, 0.22, Math.sin(la) * 0.08]}
                  rotation={[Math.cos(la) * 0.16, 0, -Math.sin(la) * 0.16]}
                  raycast={() => null}
                >
                  <cylinderGeometry args={[0.014, 0.014, 0.44, 6]} />
                  <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
