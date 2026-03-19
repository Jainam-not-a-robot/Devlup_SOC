import { Html, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { DoubleSide, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";

type RoomProps = {
  onMonitorClick: (point: Vector3) => void;
  onSeatClick?: (point: Vector3) => void;
  monitorUrl?: string | null;
};

type MonitorSurfaceProps = {
  mesh: Mesh;
  url: string;
};

const ROOM_SCALE = 0.5;
const ROOM_POSITION: [number, number, number] = [0, -1, 0];
const MONITOR_NAME = "monitor";
const SEAT_NAME = "seat001";
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function normalizeObjectName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function objectMatchesName(object: Object3D | null, expectedName: string) {
  let current: Object3D | null = object;
  const normalizedExpectedName = normalizeObjectName(expectedName);

  while (current) {
    const normalizedCurrentName = normalizeObjectName(current.name || "");
    if (normalizedCurrentName === normalizedExpectedName) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

const MONITOR_WEBPAGE_TRANSFORM = {
  position: { x: 0, y: 0, z: -1 },
  rotationDegrees: { x: 90, y: 180, z: 0 },
  scale: { x: 40, y: 1 },
  resolution: { width: 1280, minHeight: 1280 },
  borderRadius: 22,
};

function MonitorSurface({ mesh, url }: MonitorSurfaceProps) {
  const dimensions = useMemo(() => {
    mesh.geometry.computeBoundingBox();
    const boundingBox = mesh.geometry.boundingBox;

    if (!boundingBox) {
      return {
        center: new Vector3(),
        size: new Vector3(1, 1, 0.05),
        frontZ: 0.025,
      };
    }

    return {
      center: boundingBox.getCenter(new Vector3()),
      size: boundingBox.getSize(new Vector3()),
      frontZ: boundingBox.max.z,
    };
  }, [mesh]);

  const widthUnits = Math.max(dimensions.size.x * MONITOR_WEBPAGE_TRANSFORM.scale.x, 0.1);
  const heightUnits = Math.max(dimensions.size.y * MONITOR_WEBPAGE_TRANSFORM.scale.y, 0.1);
  const widthPixels = MONITOR_WEBPAGE_TRANSFORM.resolution.width;
  const heightPixels = Math.max(
    MONITOR_WEBPAGE_TRANSFORM.resolution.minHeight,
    Math.round((widthPixels * heightUnits) / widthUnits),
  );
  const htmlScale = widthUnits / widthPixels;

  return (
    <group
      position={[
        dimensions.center.x + dimensions.size.x * MONITOR_WEBPAGE_TRANSFORM.position.x,
        dimensions.center.y + dimensions.size.y * MONITOR_WEBPAGE_TRANSFORM.position.y,
        dimensions.frontZ + MONITOR_WEBPAGE_TRANSFORM.position.z,
      ]}
      rotation={[
        toRadians(MONITOR_WEBPAGE_TRANSFORM.rotationDegrees.x),
        toRadians(MONITOR_WEBPAGE_TRANSFORM.rotationDegrees.y),
        toRadians(MONITOR_WEBPAGE_TRANSFORM.rotationDegrees.z),
      ]}
    >
      <Html
        transform
        center
        occlude={false}
        zIndexRange={[1, 0]}
        scale={htmlScale}
        style={{
          width: `${widthPixels}px`,
          height: `${heightPixels}px`,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: `${MONITOR_WEBPAGE_TRANSFORM.borderRadius}px`,
          background: "#050816",
          boxShadow: "0 0 30px rgba(34, 211, 238, 0.22)",
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
        }}
      >
       
        <iframe
          title="Website monitor preview"
          src={url}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            background: "#050816",
          }}
        />
      </Html>
    </group>
  );
}

export default function Room({ onMonitorClick, onSeatClick, monitorUrl }: RoomProps) {
  const { scene } = useGLTF("/model.glb");
  const [monitorMesh, setMonitorMesh] = useState<Mesh | null>(null);

  useEffect(() => {
    let exactMonitorMesh: Mesh | null = null;

    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const name = (mesh.name || "").toLowerCase();
      if (name === MONITOR_NAME) {
        exactMonitorMesh = mesh;

        const liveMonitorMaterial = new MeshStandardMaterial({
          color: "#050816",
          emissive: "#020617",
          emissiveIntensity: 0.45,
          roughness: 0.3,
          metalness: 0.15,
          side: DoubleSide,
        });
        liveMonitorMaterial.needsUpdate = true;
        mesh.material = liveMonitorMaterial;
      }
    });

    setMonitorMesh(exactMonitorMesh);
  }, [scene]);

  return (
    <group scale={ROOM_SCALE} position={ROOM_POSITION}>
      <primitive
        object={scene}
        onPointerMove={(e) => {
          const name = (e.object.name || "").toLowerCase();
          if (name.includes("monitor") || name.includes("screen")) {
            const material = e.object.material;
            if (material instanceof MeshStandardMaterial) {
              material.emissiveIntensity = 0.75;
              material.needsUpdate = true;
            }
          }
        }}
        onPointerOut={(e) => {
          const material = e.object.material;
          if (material instanceof MeshStandardMaterial) {
            material.emissiveIntensity = 0.35;
            material.needsUpdate = true;
          }
        }}
        onPointerDown={(e) => {
          console.info("[Room] Pointer down on:", e.object.name || "(unnamed mesh)");

          if (objectMatchesName(e.object, SEAT_NAME)) {
            console.info("[Room] Seat click detected via:", e.object.name || "(unnamed mesh)");
            onSeatClick?.(e.point.clone());
            return;
          }

          const name = (e.object.name || "").toLowerCase();
          if (name.includes("monitor") || name.includes("screen")) {
            onMonitorClick(e.point.clone());
          }
        }}
      />

      {monitorMesh && monitorUrl && (
        <group
          position={monitorMesh.position}
          rotation={monitorMesh.rotation}
          scale={monitorMesh.scale}
        >
          <MonitorSurface mesh={monitorMesh} url={monitorUrl} />
        </group>
      )}
    </group>
  );
}
