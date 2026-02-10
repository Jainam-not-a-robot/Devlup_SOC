import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF("/model.glb");

  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={scene} scale={0.5} position={[0, -1, 0]} />;
}

export default function Entry3D() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      {/* 👇 NOTHING except Canvas here */}
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 6], fov: 45 }}
      >
        <ambientLight intensity={0.6} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
        />

        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.7}
        />

        <Model />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
