import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Billboard, Text } from '@react-three/drei';

// A cute low-poly person, ~0.9 units tall, built from primitives.
//
//   color  -> clothing / torso (and the active feet halo)
//   skin   -> head + hands
//   name   -> optional floating billboard label above the head
//   active -> true: full opacity + glowing feet ring; false: greyed & faded.
//
// Root <group> spreads ...props so the caller positions/rotates it.
export default function Avatar({
  color = '#b8a9e8',
  skin = '#e9c6a8',
  name,
  active = true,
  ...props
}) {
  const root = useRef();
  const head = useRef();
  const haloRef = useRef();

  // A stable per-instance phase so several avatars don't bob in lockstep.
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  // "Away" avatars read as faded/greyed; opacity ~0.35.
  const dim = active === false;
  const op = dim ? 0.35 : 1;

  // Shared material props so every limb fades together when away.
  const bodyMat = { transparent: dim, opacity: op, roughness: 0.85 };
  const skinMat = { transparent: dim, opacity: op, roughness: 0.7 };

  useFrame((s) => {
    const t = s.clock.elapsedTime + phase;
    // Gentle breathing bob of the whole body.
    if (root.current) {
      root.current.position.y = (props.position?.[1] ?? 0) + Math.sin(t * 1.6) * 0.012;
    }
    // Occasional slow look-around (head turns, then settles).
    if (head.current) {
      const look = Math.sin(t * 0.5) * 0.35 * (0.5 + 0.5 * Math.sin(t * 0.18));
      head.current.rotation.y = look;
      head.current.position.y = 0.74 + Math.sin(t * 1.6 + 0.4) * 0.006;
    }
    // Pulse the active halo.
    if (haloRef.current) {
      const k = 0.55 + Math.sin(t * 2.2) * 0.18;
      haloRef.current.material.opacity = k;
      const sc = 1 + Math.sin(t * 2.2) * 0.06;
      haloRef.current.scale.set(sc, sc, sc);
    }
  });

  return (
    <group ref={root} {...props}>
      {/* ── soft glowing feet halo (active only) ── */}
      {!dim && (
        <mesh
          ref={haloRef}
          position={[0, 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[0.16, 0.24, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* ── legs ── */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]} castShadow raycast={() => null}>
          <cylinderGeometry args={[0.05, 0.05, 0.28, 10]} />
          <meshStandardMaterial color="#3a3160" {...bodyMat} />
        </mesh>
      ))}
      {/* little shoes */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.025, 0.03]} castShadow raycast={() => null}>
          <boxGeometry args={[0.1, 0.05, 0.16]} />
          <meshStandardMaterial color="#2a2440" {...bodyMat} />
        </mesh>
      ))}

      {/* ── torso (clothing) ── */}
      <RoundedBox
        args={[0.3, 0.36, 0.2]}
        radius={0.09}
        smoothness={3}
        position={[0, 0.46, 0]}
        castShadow
        raycast={() => null}
      >
        <meshStandardMaterial color={color} {...bodyMat} />
      </RoundedBox>

      {/* ── arms ── */}
      {[
        [-0.19, 0.4],
        [0.19, -0.4],
      ].map(([x, rot]) => (
        <mesh
          key={x}
          position={[x, 0.46, 0]}
          rotation={[0, 0, rot]}
          castShadow
          raycast={() => null}
        >
          <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
          <meshStandardMaterial color={color} {...bodyMat} />
        </mesh>
      ))}
      {/* hands */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.33, 0]} castShadow raycast={() => null}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={skin} {...skinMat} />
        </mesh>
      ))}

      {/* ── head + hair (turns when looking around) ── */}
      <group ref={head} position={[0, 0.74, 0]}>
        <mesh castShadow raycast={() => null}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color={skin} {...skinMat} />
        </mesh>
        {/* hair cap */}
        <mesh
          position={[0, 0.04, -0.01]}
          rotation={[0.2, 0, 0]}
          castShadow
          raycast={() => null}
        >
          <sphereGeometry args={[0.148, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color="#4a3a52" {...bodyMat} />
        </mesh>
        {/* eyes */}
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0.0, 0.125]} raycast={() => null}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial
              color="#1a1428"
              transparent={dim}
              opacity={op}
              toneMapped={false}
            />
          </mesh>
        ))}
        {/* rosy cheeks */}
        {[-0.085, 0.085].map((x) => (
          <mesh key={x} position={[x, -0.035, 0.115]} raycast={() => null}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#ff9ec4" transparent opacity={dim ? 0.2 : 0.5} />
          </mesh>
        ))}
      </group>

      {/* ── floating name label ── */}
      {name && (
        <Billboard position={[0, 1.06, 0]}>
          <Text
            fontSize={0.1}
            color={dim ? '#9a93b5' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.006}
            outlineColor="#15182f"
            fillOpacity={op}
          >
            {name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
