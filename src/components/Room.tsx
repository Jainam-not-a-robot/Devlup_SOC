import { useGLTF, useTexture } from "@react-three/drei";
import { DoubleSide, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { useEffect, useState } from "react";

export default function Room({ onMonitorClick }) {
  const { scene } = useGLTF("/model.glb");
  const screenTexture = useTexture("/screenshots/screenshot.png");
  const [hoveredMonitor, setHoveredMonitor] = useState(null);

  useEffect(() => {
    if (screenTexture) {
      screenTexture.colorSpace = SRGBColorSpace;
      screenTexture.flipY = false;
      screenTexture.center.set(0.5, 0.5);
      // no rotation: keep monitor texture upright
      screenTexture.needsUpdate = true;
    }

    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const name = (mesh.name || "").toLowerCase();
      if (name.includes("monitor") || name.includes("screen")) {
        console.info("[Room] Found monitor mesh:", mesh.name, "material type", Array.isArray(mesh.material) ? mesh.material.map((m) => m.type).join(",") : mesh.material?.type);

        const monitorMaterial = new MeshStandardMaterial({
          color: 0xffffff,
          map: screenTexture,
          emissive: 0xffffff,
          emissiveMap: screenTexture,
          emissiveIntensity: 0.35,
          roughness: 0.25,
          metalness: 0.1,
          side: DoubleSide,
        });
        monitorMaterial.needsUpdate = true;
        mesh.material = monitorMaterial;
      }
    });
  }, [scene, screenTexture]);

  return (
    <primitive
      object={scene}
      scale={0.5}
      position={[0, -1, 0]}
      onPointerMove={(e) => {
        const name = (e.object.name || "").toLowerCase();
        if (name.includes("monitor") || name.includes("screen")) {
          setHoveredMonitor(e.object.uuid);
          const material = e.object.material;
          if (material instanceof MeshStandardMaterial) {
            material.emissiveIntensity = 0.75;
            material.needsUpdate = true;
          }
        }
      }}
      onPointerOut={() => {
        setHoveredMonitor(null);
      }}
      onPointerDown={(e) => {
        const name = (e.object.name || "").toLowerCase();
        if (name.includes("monitor") || name.includes("screen")) {
          onMonitorClick(e.point.clone());
        }
      }}
      onPointerMissed={() => setHoveredMonitor(null)}
    />
  );
}