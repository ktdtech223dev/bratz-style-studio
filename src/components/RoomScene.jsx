import { lazy, Suspense } from 'react';
import RoomSceneSvg from './RoomSceneSvg';
import { hasWebGL } from './room3d/useWebGL';

// Lazy-load the 3D room so the heavy three.js chunk is only fetched when WebGL
// is actually available.
const Room3D = lazy(() => import('./room3d/Room3D'));

// Thin loader: picks the true 3D room when WebGL is supported, otherwise falls
// back to the 2D SVG room. Same default export name + no required props, so
// Home.jsx (interactive) and Decorate.jsx (pointer-events-none preview) keep
// rendering <RoomScene/> unchanged.
export default function RoomScene() {
  if (!hasWebGL()) return <RoomSceneSvg />;
  return (
    <Suspense fallback={<RoomSceneSvg />}>
      <Room3D />
    </Suspense>
  );
}
