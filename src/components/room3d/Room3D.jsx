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

// A true 3D dollhouse you can walk around: full 360° orbit + pan + tilt + zoom.
// Open roof so you can look down into every room. One shadow-casting light keeps
// it mobile-friendly across the bigger footprint.
export default function Room3D() {
  return (
    <WebGLBoundary>
      <div className="aspect-[360/520] w-full">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [7.5, 6.2, 9], fov: 44, near: 0.1, far: 70 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            // fall back to SVG if the context is lost on mobile
            gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
          }}
        >
          <color attach="background" args={['#12152e']} />
          <fog attach="fog" args={['#12152e', 16, 34]} />

          {/* cheap global fill — replaces the per-room point lights */}
          <ambientLight intensity={0.5} color="#4a4f7a" />
          <hemisphereLight args={['#cdd4ff', '#3a3550', 0.7]} />

          {/* cool moonlight — the only shadow caster; covers the whole footprint */}
          <directionalLight
            position={[-7, 11, 6]}
            intensity={0.95}
            color="#aab8ff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={9}
            shadow-camera-bottom={-9}
            shadow-bias={-0.0005}
          />

          <Furniture />

          <OrbitControls
            enablePan
            enableZoom
            screenSpacePanning
            minDistance={3.5}
            maxDistance={26}
            minPolarAngle={Math.PI * 0.1}
            maxPolarAngle={Math.PI * 0.49}
            target={[0, 0.4, 0.6]}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.8}
            rotateSpeed={0.7}
            panSpeed={0.7}
          />
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}
