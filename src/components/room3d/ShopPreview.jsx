import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { Sofa, BedFrame, CoffeeTableF, FloorLamp, AreaRug } from './furniture';

// Slots that get a real rotating 3D model in the shop. Material/color slots
// (wallpaper, floor, pot, cat, collar, theme) keep their flat swatch.
export const PREVIEW_SLOTS = ['sofa', 'bed', 'coffeetable', 'lamp', 'rug'];

function PreviewItem({ slot, data }) {
  if (!data) return null;
  switch (slot) {
    case 'sofa':
      return <Sofa color={data.sofa?.color} style={data.sofa?.style} />;
    case 'bed':
      return <BedFrame color={data.bed?.color} sheets={data.bed?.sheets} />;
    case 'coffeetable':
      return <CoffeeTableF color={data.table?.color} style={data.table?.style} />;
    case 'lamp':
      return <FloorLamp color={data.lamp?.color} />;
    case 'rug':
      return <AreaRug color={data.rug?.color} rotation={[0, 0, 0]} />;
    default:
      return null;
  }
}

// A small auto-rotating 3D preview of the selected furniture item. Lazy-loaded
// (default export) so three.js stays in its own chunk.
export default function ShopPreview({ slot, data }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [1.7, 1.25, 2.0], fov: 38 }} gl={{ antialias: true }}>
      <color attach="background" args={['#20264f']} />
      <ambientLight intensity={0.7} color="#cdd4ff" />
      <hemisphereLight args={['#dfe4ff', '#3a3550', 0.7]} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <Center>
        <PreviewItem slot={slot} data={data} />
      </Center>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={3.5}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.52}
      />
    </Canvas>
  );
}
