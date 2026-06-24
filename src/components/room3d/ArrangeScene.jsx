import { Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Furniture from './Furniture';
import RoomSceneSvg from '../RoomSceneSvg';

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <RoomSceneSvg />;
    return this.props.children;
  }
}

// Interactive editor canvas. OrbitControls.makeDefault so the drag layer can grab
// the controls ref (to disable orbit while dragging a piece). Looser limits than
// the home view so you can frame the whole house while arranging.
export default function ArrangeScene() {
  return (
    <Boundary>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [7.5, 6.5, 9], fov: 44, near: 0.1, far: 70 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        <color attach="background" args={['#12152e']} />
        <ambientLight intensity={0.5} color="#4a4f7a" />
        <hemisphereLight args={['#cdd4ff', '#3a3550', 0.7]} />
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
          makeDefault
          enablePan
          enableZoom
          screenSpacePanning
          minDistance={3.5}
          maxDistance={30}
          minPolarAngle={Math.PI * 0.08}
          maxPolarAngle={Math.PI * 0.49}
          target={[0, 0.4, 0.6]}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </Boundary>
  );
}
