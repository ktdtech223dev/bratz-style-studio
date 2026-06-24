import { Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Furniture from './Furniture';
import RoomSceneSvg from '../RoomSceneSvg';

// Error boundary: if WebGL is lost or the scene throws, fall back to the 2D SVG
// room so the page never breaks.
class WebGLBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn('Room3D fell back to 2D:', err?.message || err);
  }
  render() {
    if (this.state.failed) return <RoomSceneSvg />;
    return this.props.children;
  }
}

// True 3D cozy bedroom. Constrained orbit so the user can gently look around but
// not lose the framing. One shadow-casting light for mobile performance.
export default function Room3D() {
  return (
    <WebGLBoundary>
      <div className="aspect-[360/520] w-full">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 1.3, 5.4], fov: 38 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            // fall back to SVG if the context is lost on mobile
            gl.domElement.addEventListener(
              'webglcontextlost',
              (e) => e.preventDefault(),
              false,
            );
          }}
        >
          <color attach="background" args={['#1a1f4a']} />

          {/* low ambient fill */}
          <ambientLight intensity={0.32} color="#3a3f73" />

          {/* cool moonlight — the only shadow caster */}
          <directionalLight
            position={[-3.5, 5, 2]}
            intensity={0.9}
            color="#aab8ff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-bias={-0.0005}
          />

          {/* warm lamp fill (no shadow, cheap) */}
          <pointLight position={[1.4, 1.6, 1.0]} intensity={0.5} color="#ffb86b" distance={4} decay={2} />

          <Furniture />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI * 0.36}
            maxPolarAngle={Math.PI * 0.52}
            minAzimuthAngle={-0.5}
            maxAzimuthAngle={0.5}
            target={[0, 0.8, 0]}
            enableDamping
            dampingFactor={0.1}
          />
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}
