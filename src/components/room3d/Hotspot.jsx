import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrame } from '@react-three/fiber';

// Tappable hotspot that navigates on click. Highlights on hover with a cheap
// scale pulse on a ref (NO per-hotspot pointLight — that was the main perf cost
// with ~9 hotspots; WebGL chokes on many dynamic lights). `glow` kept for API
// compatibility (callers still pass it) but no longer spawns a light.
export default function Hotspot({ to, label, glow, children, ...groupProps }) {
  const nav = useNavigate();
  const [hover, setHover] = useState(false);
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    const target = hover ? 1.06 : 1.0;
    const s = ref.current.scale.x + (target - ref.current.scale.x) * 0.2;
    ref.current.scale.setScalar(s);
  });

  return (
    <group {...groupProps}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          nav(to);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {children}
      </group>
    </group>
  );
}
