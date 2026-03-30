import { Html, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { DoubleSide, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";

type RoomProps = {
  onMonitorClick: (point: Vector3) => void;
  onSeatClick?: (point: Vector3) => void;
  monitorUrl?: string | null;
};

type MonitorSurfaceProps = {
  mesh: Mesh;
  url: string;
};

type MonitorInteractionPlaneProps = {
  mesh: Mesh;
  onInteract: (point: Vector3) => void;
};

const ROOM_SCALE = 0.5;
const ROOM_POSITION: [number, number, number] = [0, -1, 0];
const ROOM_ENVIRONMENT_INTENSITY = 0.05;
const ROOM_EMISSIVE_INTENSITY_MULTIPLIER = 1;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const MONITOR_WEBPAGE_TRANSFORM = {
  position: { x: 0, y: 0, z: -1 },
  rotationDegrees: { x: 90, y: 180, z: 0 },
  scale: { x: 40, y: 1 },
  resolution: { width: 1280, minHeight: 1280 },
  borderRadius: 22,
};
const MONITOR_BACKLIGHT = {
  color: "#2563eb",
  intensity: 40,
  width: 1.5,
  height: 0.9,
  position: [0, 0, -0.18] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
};
const LAMP_LIGHT = {
  color: "#ff9a3c",
  intensity: 10,
  distance: 2.2,
  decay: 2.4,
  position: [-1.85, -0.35, -1.25] as [number, number, number],

};
const ROOM_BORDER_LIGHTS = [
  {
    key: "back",
    color: "#ef4444",
    intensity: 30,
    width: 14,
    height: 0.18,
    position: [0.15, 4, -5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    key: "front",
    color: "#ef4444",
    intensity: 14,
    width: 14,
    height: 0.18,
    position: [0.15, 5, 4] as [number, number, number],
    rotation: [20, Math.PI, 0] as [number, number, number],
  },
  
  {
    key: "right",
    color: "#ef4444",
    intensity: 14,
    width: 10,
    height: 0.18,
    position: [7, 4.85, 0] as [number, number, number],
    rotation: [0, -Math.PI / 2, 0] as [number, number, number],
  },
] as const;

function getMeshDimensions(mesh: Mesh) {
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
}

function MonitorInteractionPlane({ mesh, onInteract }: MonitorInteractionPlaneProps) {
  const dimensions = useMemo(() => getMeshDimensions(mesh), [mesh]);

  return (
    <mesh
      position={[
        dimensions.center.x,
        dimensions.center.y,
        dimensions.frontZ + 0.02,
      ]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onInteract(event.point.clone());
      }}
    >
      <planeGeometry
        args={[
          Math.max(dimensions.size.x * 1.2, 0.8),
          Math.max(dimensions.size.y * 1.2, 0.5),
        ]}
      />
      <meshBasicMaterial
        transparent
        opacity={0.001}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function MonitorSurface({ mesh, url }: MonitorSurfaceProps) {
  const dimensions = useMemo(() => getMeshDimensions(mesh), [mesh]);

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
            pointerEvents: "none",
          }}
        />
      </Html>
    </group>
  );
}

function Room({ onMonitorClick, onSeatClick, monitorUrl }: RoomProps) {
  const { gl } = useThree();
  const roomGroupRef = useRef<Group | null>(null);
  const ktx2Loader = useMemo(
    () => new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl),
    [gl],
  );
  const { scene } = useGLTF(
    "/model-compressed.glb",
    false,
    false,
    (loader: GLTFLoader) => {
      loader.setKTX2Loader(ktx2Loader);
    },
  );
  const [monitorMesh, setMonitorMesh] = useState<Mesh | null>(null);

  useEffect(() => {
    return () => {
      ktx2Loader.dispose();
    };
  }, [ktx2Loader]);

  useEffect(() => {
    let foundMonitorMesh: Mesh | null = null;

    scene.traverse((obj) => {
      const mesh = obj as Mesh;

      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const applyDarkRoomMaterialTuning = (material: unknown) => {
        if (!(material instanceof MeshStandardMaterial)) return;

        material.envMapIntensity = ROOM_ENVIRONMENT_INTENSITY;
        material.roughness = Math.max(material.roughness, 0.92);
        material.metalness = Math.min(material.metalness, 0.04);
        material.emissiveIntensity *= ROOM_EMISSIVE_INTENSITY_MULTIPLIER;
        material.needsUpdate = true;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyDarkRoomMaterialTuning);
      } else {
        applyDarkRoomMaterialTuning(mesh.material);
      }

      const name = (mesh.name || "").toLowerCase();
      if (name.includes("monitor") || name.includes("screen")) {
        foundMonitorMesh = mesh;

        const liveMonitorMaterial = new MeshStandardMaterial({
          color: "#050816",
          emissive: "#020617",
          emissiveIntensity: 0.18,
          roughness: 0.95,
          metalness: 0.02,
          envMapIntensity: 0.01,
          side: DoubleSide,
        });
        liveMonitorMaterial.needsUpdate = true;
        mesh.material = liveMonitorMaterial;
      }
    });

    if (foundMonitorMesh) {
      console.log("Monitor found:", foundMonitorMesh.name);
      setMonitorMesh(foundMonitorMesh);
    } else {
      console.warn("Monitor not found");
      setMonitorMesh(null);
    }
  }, [scene]);

  return (
    <group ref={roomGroupRef} scale={ROOM_SCALE} position={ROOM_POSITION}>
      <ambientLight intensity={0.08} color="#f8f1e3" />
      <pointLight
        color={LAMP_LIGHT.color}
        intensity={LAMP_LIGHT.intensity}
        distance={LAMP_LIGHT.distance}
        decay={LAMP_LIGHT.decay}
        position={LAMP_LIGHT.position}
      />
      {ROOM_BORDER_LIGHTS.map((light) => (
        <rectAreaLight
          key={light.key}
          color={light.color}
          intensity={light.intensity}
          width={light.width}
          height={light.height}
          position={light.position}
          rotation={light.rotation}
        />
      ))}
      <primitive
        object={scene}
        onPointerMove={(e) => {
          const name = (e.object.name || "").toLowerCase();

          if (name.includes("monitor") || name.includes("screen")) {
            const material = e.object.material;
            if (material instanceof MeshStandardMaterial) {
              material.emissiveIntensity = 0.28;
              material.needsUpdate = true;
            }
          }
        }}
        onPointerOut={(e) => {
          const material = e.object.material;
          if (material instanceof MeshStandardMaterial) {
            material.emissiveIntensity = 0.12;
            material.needsUpdate = true;
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();

          const name = (e.object.name || "").toLowerCase();

          console.log("Clicked:", name);

          if (name.includes("monitor") || name.includes("screen")) {
            console.log("Monitor clicked");
            onMonitorClick(e.point.clone());
            return;
          }

          if (name.includes("seat")) {
            onSeatClick?.(e.point.clone());
          }
        }}
      />

      {monitorMesh && (
        <group
          position={monitorMesh.position}
          rotation={monitorMesh.rotation}
          scale={monitorMesh.scale}
        >
          <MonitorInteractionPlane
            mesh={monitorMesh}
            onInteract={(point) => {
              console.log("Monitor clicked");
              onMonitorClick(point);
            }}
          />
          <rectAreaLight
            color={MONITOR_BACKLIGHT.color}
            intensity={MONITOR_BACKLIGHT.intensity}
            width={MONITOR_BACKLIGHT.width}
            height={MONITOR_BACKLIGHT.height}
            position={MONITOR_BACKLIGHT.position}
            rotation={MONITOR_BACKLIGHT.rotation}
          />
          {monitorUrl && <MonitorSurface mesh={monitorMesh} url={monitorUrl} />}
        </group>
      )}
    </group>
  );
}

export default memo(Room);
