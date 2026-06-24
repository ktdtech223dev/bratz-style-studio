import { lazy, Suspense } from 'react';
import StarMapFallback from './StarMapFallback';
import { hasWebGL } from '../room3d/useWebGL';

// Lazy-load the 3D star dome so the heavy three.js chunk is only fetched when
// WebGL is actually available. Mirrors src/components/RoomScene.jsx.
const StarMapScene = lazy(() => import('./StarMapScene'));

// Thin loader: picks the true 3D dome when WebGL is supported, otherwise falls
// back to the flat 2D gradient sky. Both share the same { stars, onSelect,
// selectedId } contract so StarMap.jsx renders <StarDome/> unchanged.
export default function StarDome(props) {
  if (!hasWebGL()) return <StarMapFallback {...props} />;
  return (
    <Suspense fallback={<StarMapFallback {...props} />}>
      <StarMapScene {...props} fallbackProps={props} />
    </Suspense>
  );
}
