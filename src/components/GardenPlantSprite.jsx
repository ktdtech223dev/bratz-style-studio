import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Plant3D from './room3d/Plant3D';
import { hasWebGL } from './room3d/useWebGL';

// Shared species catalog (used by the sprite + the "add plant" sheet).
export const SPECIES = {
  monstera: { label: 'Monstera', emoji: '🌿' },
  cactus: { label: 'Cactus', emoji: '🌵' },
  sunflower: { label: 'Sunflower', emoji: '🌻' },
  bonsai: { label: 'Bonsai', emoji: '🎍' },
  succulent: { label: 'Succulent', emoji: '🪴' },
  bamboo: { label: 'Bamboo', emoji: '🎋' },
  rose: { label: 'Rose', emoji: '🌹' },
  tulip: { label: 'Tulip', emoji: '🌷' },
};

// Lightweight emoji fallback when WebGL is unavailable.
function EmojiFallback({ species, stage, size }) {
  const sp = SPECIES[species] || SPECIES.monstera;
  const emoji = stage <= 0 ? '🌱' : stage < 2 ? '🌿' : sp.emoji;
  const plantSize = size * (0.4 + Math.min(stage, 4) * 0.1);
  return (
    <div style={{ width: size, height: size }} className="relative flex items-end justify-center">
      <span style={{ fontSize: plantSize, lineHeight: 1, marginBottom: size * 0.2 }}>{emoji}</span>
    </div>
  );
}

// Renders one garden plant in 3D in a small, demand-driven canvas (no idle
// render loop). Keeps the same props as before: species / stage / size.
export default function GardenPlantSprite({ species, stage = 0, size = 104 }) {
  if (!hasWebGL()) return <EmojiFallback species={species} stage={stage} size={size} />;

  return (
    <div style={{ width: size, height: size }} className="relative">
      <Canvas
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [0, 0.35, 2.1], fov: 38 }}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.7} color="#dfe3ff" />
        <directionalLight position={[2, 3, 2]} intensity={1.0} color="#fff3d6" />
        <pointLight position={[-2, 1, 1]} intensity={0.4} color="#9be89b" />
        <Suspense fallback={null}>
          <Plant3D
            species={species}
            stage={stage}
            sway={false}
            position={[0, -0.35, 0]}
            scale={1.35}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
