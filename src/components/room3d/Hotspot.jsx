import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrame } from '@react-three/fiber';

// Wraps a chunk of room geometry as a tappable hotspot that navigates on click
// and shows a soft emissive highlight on hover. Children render inside a group
// whose child meshes inherit the highlight via an invisible "glow" point light
// that brightens on hover (works without mutating each child material).
//
// props:
//   to    route to navigate to on click
//   label aria/title-ish label (used for cursor + a11y intent)
//   glow  highlight color (default warm pink)
export default function Hotspot({ to, label, glow = '#ff9fc4', children, ...groupProps }) {
  const nav = useNavigate();
  const [hover, setHover] = useState(false);
  const lightRef = useRef();

  useFrame(() => {
    if (!lightRef.current) return;
    const target = hover ? 0.9 : 0;
    lightRef.current.intensity += (target - lightRef.current.intensity) * 0.18;
  });

  return (
    <group
      {...groupProps}
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
      {/* co-located highlight that lifts the whole hotspot on hover */}
      <pointLight ref={lightRef} color={glow} intensity={0} distance={1.6} decay={2} />
      {children}
    </group>
  );
}
