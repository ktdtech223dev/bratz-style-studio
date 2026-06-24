import { RoundedBox } from '@react-three/drei';
import { WOOD, WOOD_DARK, METAL, lighten, darken, muted, nudgeHue } from './_helpers';

// ── BedFrame: ~1.5w x 1.0d — frame + headboard + mattress + pillows ──────────
// `color` = frame/wood, `sheets` = mattress/duvet color.
export function BedFrame({ color = WOOD, sheets = '#e8e6f5', ...props }) {
  const frame = color;
  const duvet = sheets;
  const pillowA = lighten(sheets, 0.06);
  const pillowB = nudgeHue(sheets, 30, -0.04);

  return (
    <group {...props}>
      {/* base frame */}
      <RoundedBox args={[1.5, 0.22, 1.0]} radius={0.04} smoothness={3} position={[0, 0.11, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={frame} roughness={0.85} />
      </RoundedBox>

      {/* headboard */}
      <RoundedBox args={[1.5, 0.5, 0.08]} radius={0.06} smoothness={3} position={[0, 0.34, -0.46]} castShadow>
        <meshStandardMaterial color={lighten(color, 0.05)} roughness={0.85} />
      </RoundedBox>

      {/* mattress */}
      <RoundedBox args={[1.4, 0.16, 0.92]} radius={0.06} smoothness={3} position={[0, 0.3, 0.02]} castShadow receiveShadow>
        <meshStandardMaterial color={lighten(sheets, 0.1)} roughness={0.95} />
      </RoundedBox>

      {/* duvet / blanket folded over the lower half */}
      <RoundedBox args={[1.42, 0.1, 0.58]} radius={0.05} smoothness={3} position={[0, 0.36, 0.21]} castShadow>
        <meshStandardMaterial color={duvet} roughness={0.92} />
      </RoundedBox>
      {/* duvet fold lip */}
      <RoundedBox args={[1.42, 0.06, 0.1]} radius={0.03} smoothness={2} position={[0, 0.4, -0.05]} raycast={() => null}>
        <meshStandardMaterial color={darken(sheets, 0.08)} roughness={0.92} />
      </RoundedBox>

      {/* two pillows */}
      <RoundedBox args={[0.5, 0.12, 0.3]} radius={0.06} smoothness={3} position={[-0.35, 0.42, -0.26]} rotation={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color={pillowA} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.12, 0.3]} radius={0.06} smoothness={3} position={[0.35, 0.42, -0.26]} rotation={[0, -0.1, 0]} castShadow>
        <meshStandardMaterial color={pillowB} roughness={0.95} />
      </RoundedBox>

      {/* feet */}
      {[
        [-0.66, 0.42],
        [0.66, 0.42],
        [-0.66, -0.42],
        [0.66, -0.42],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.03, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.035, 0.03, 0.06, 8]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Crib: baby crib ~0.9w x 0.6d with slatted sides + tiny blanket ───────────
export function Crib({ color = '#cdbfe6', ...props }) {
  const rail = color;
  const post = darken(color, 0.12);
  const W = 0.9;
  const D = 0.6;
  const railY = 0.62;
  const slatN = 9; // per long side

  return (
    <group {...props}>
      {/* corner posts */}
      {[
        [-W / 2, -D / 2],
        [W / 2, -D / 2],
        [-W / 2, D / 2],
        [W / 2, D / 2],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.34, p[1]]} castShadow raycast={() => null}>
          <boxGeometry args={[0.05, 0.68, 0.05]} />
          <meshStandardMaterial color={post} roughness={0.8} />
        </mesh>
      ))}

      {/* top + bottom rails (both long sides) */}
      {[-1, 1].map((sz) =>
        [railY, 0.18].map((y, k) => (
          <mesh key={`${sz}r${k}`} position={[0, y, (sz * D) / 2]} castShadow raycast={() => null}>
            <boxGeometry args={[W, 0.04, 0.04]} />
            <meshStandardMaterial color={rail} roughness={0.8} />
          </mesh>
        )),
      )}
      {/* short-side rails */}
      {[-1, 1].map((sx) =>
        [railY, 0.18].map((y, k) => (
          <mesh key={`${sx}sr${k}`} position={[(sx * W) / 2, y, 0]} castShadow raycast={() => null}>
            <boxGeometry args={[0.04, 0.04, D]} />
            <meshStandardMaterial color={rail} roughness={0.8} />
          </mesh>
        )),
      )}

      {/* slats (front + back) */}
      {[-1, 1].map((sz) =>
        Array.from({ length: slatN }).map((_, i) => {
          const x = -W / 2 + 0.08 + (i * (W - 0.16)) / (slatN - 1);
          return (
            <mesh key={`${sz}s${i}`} position={[x, 0.4, (sz * D) / 2]} raycast={() => null}>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 6]} />
              <meshStandardMaterial color={lighten(color, 0.04)} roughness={0.8} />
            </mesh>
          );
        }),
      )}

      {/* mattress */}
      <RoundedBox args={[W - 0.08, 0.08, D - 0.08]} radius={0.03} smoothness={2} position={[0, 0.22, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f4f1fb" roughness={0.95} />
      </RoundedBox>
      {/* tiny blanket */}
      <RoundedBox args={[W - 0.2, 0.04, D - 0.26]} radius={0.03} smoothness={2} position={[0, 0.27, 0.06]} castShadow>
        <meshStandardMaterial color={nudgeHue(color, 40, 0.04)} roughness={0.92} />
      </RoundedBox>
      {/* little pillow */}
      <RoundedBox args={[0.22, 0.06, 0.14]} radius={0.04} smoothness={2} position={[0, 0.29, -0.18]} raycast={() => null}>
        <meshStandardMaterial color={lighten(color, 0.12)} roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

// ── Dresser: ~0.9w x 0.45d x 0.8h with drawers + knobs ───────────────────────
export function Dresser({ color = WOOD, ...props }) {
  const body = color;
  const drawer = lighten(color, 0.07);
  const rows = 3;
  const cols = 2;
  const W = 0.9;
  const H = 0.8;
  const dH = (H - 0.1) / rows;

  return (
    <group {...props}>
      {/* carcass */}
      <RoundedBox args={[W, H, 0.45]} radius={0.03} smoothness={3} position={[0, H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.82} />
      </RoundedBox>
      {/* top lip */}
      <RoundedBox args={[W + 0.04, 0.05, 0.49]} radius={0.02} smoothness={2} position={[0, H + 0.01, 0]} castShadow raycast={() => null}>
        <meshStandardMaterial color={darken(color, 0.08)} roughness={0.8} />
      </RoundedBox>

      {/* drawers */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const dw = (W - 0.1) / cols;
          const x = -W / 2 + 0.05 + dw / 2 + c * dw;
          const y = 0.07 + dH / 2 + r * dH;
          return (
            <group key={`${r}-${c}`}>
              <RoundedBox args={[dw - 0.03, dH - 0.04, 0.04]} radius={0.02} smoothness={2} position={[x, y, 0.235]} castShadow>
                <meshStandardMaterial color={drawer} roughness={0.78} />
              </RoundedBox>
              {/* knob */}
              <mesh position={[x, y, 0.27]} raycast={() => null}>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          );
        }),
      )}

      {/* short feet */}
      {[
        [-(W / 2 - 0.08), 0.17],
        [W / 2 - 0.08, 0.17],
        [-(W / 2 - 0.08), -0.17],
        [W / 2 - 0.08, -0.17],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.03, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── NightStand: small ~0.4 cube with a drawer + a tiny lamp ──────────────────
export function NightStand({ color = WOOD, ...props }) {
  const body = color;
  const lampShade = nudgeHue(color, 30, 0.18);

  return (
    <group {...props}>
      {/* body */}
      <RoundedBox args={[0.4, 0.4, 0.4]} radius={0.03} smoothness={3} position={[0, 0.24, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.82} />
      </RoundedBox>
      {/* drawer face */}
      <RoundedBox args={[0.34, 0.13, 0.03]} radius={0.02} smoothness={2} position={[0, 0.34, 0.205]} castShadow>
        <meshStandardMaterial color={lighten(color, 0.08)} roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0.34, 0.235]} raycast={() => null}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* legs */}
      {[
        [-0.15, 0.15],
        [0.15, 0.15],
        [-0.15, -0.15],
        [0.15, -0.15],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.03, p[1]]} raycast={() => null}>
          <cylinderGeometry args={[0.022, 0.018, 0.06, 8]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
        </mesh>
      ))}

      {/* tiny lamp on top */}
      <group position={[0, 0.44, 0]}>
        <mesh position={[0, 0.01, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.05, 0.06, 0.02, 14]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.07, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
          <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow raycast={() => null}>
          <cylinderGeometry args={[0.05, 0.07, 0.08, 16, 1, true]} />
          <meshStandardMaterial
            color={lampShade}
            emissive={lampShade}
            emissiveIntensity={0.45}
            roughness={0.6}
            side={2}
          />
        </mesh>
        <pointLight position={[0, 0.15, 0]} color={lampShade} intensity={0.5} distance={1.4} decay={2} />
      </group>
    </group>
  );
}

// ── Toybox: baby toy chest + a couple of toy blocks/ball on top ──────────────
export function Toybox({ color = '#7dd3fc', ...props }) {
  const body = color;
  const lid = lighten(color, 0.08);
  const blockA = nudgeHue(color, 60, 0.05);
  const blockB = nudgeHue(color, 140, 0.05);

  return (
    <group {...props}>
      {/* chest body */}
      <RoundedBox args={[0.6, 0.34, 0.4]} radius={0.04} smoothness={3} position={[0, 0.19, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.8} />
      </RoundedBox>
      {/* rounded barrel lid (half-cylinder, axis along x, flat side down) */}
      <mesh position={[0, 0.36, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.21, 0.21, 0.6, 20, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={lid} roughness={0.78} />
      </mesh>

      {/* toy blocks on top */}
      <RoundedBox args={[0.12, 0.12, 0.12]} radius={0.02} smoothness={2} position={[-0.16, 0.56, 0.05]} rotation={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color={blockA} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.1, 0.1]} radius={0.02} smoothness={2} position={[-0.04, 0.53, -0.08]} rotation={[0, -0.2, 0]} castShadow>
        <meshStandardMaterial color={blockB} roughness={0.6} />
      </RoundedBox>
      {/* ball */}
      <mesh position={[0.16, 0.55, 0.02]} castShadow raycast={() => null}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={muted(color, 0.18)} roughness={0.5} />
      </mesh>
    </group>
  );
}
