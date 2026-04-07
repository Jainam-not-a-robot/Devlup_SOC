import { Html, useGLTF } from "@react-three/drei";
import { createPortal, useThree } from "@react-three/fiber";
import { Fragment, memo, useEffect, useMemo, useState, useRef } from "react";
import { GLTFLoader, KTX2Loader } from "three-stdlib";
import { AxesHelper, DoubleSide, Mesh, MeshStandardMaterial, Object3D, Vector3, Raycaster, Vector2, Group, RepeatWrapping, SRGBColorSpace } from "three";

type RoomProps = {
  onMonitorClick: (point: Vector3, normal: Vector3) => void;
  onSeatClick?: (point: Vector3) => void;
  monitorUrl?: string | null;
  lampSpotEnabled?: boolean;
  isDay?: boolean;
  ambientIntensity?: number;
};

type MonitorSurfaceProps = {
  mesh: Mesh;
  url: string;
  occludeRef: React.RefObject<Group>;
};

type DebugNodeInfo = {
  id: string;
  label: string;
  object: Object3D;
  axisSize: number;
  showLabel: boolean;
};

const ROOM_SCALE = 0.5;
const ROOM_POSITION: [number, number, number] = [0, -1, 0];
const DAY_ROOM_ENVIRONMENT_INTENSITY = 0.45;
const NIGHT_ROOM_ENVIRONMENT_INTENSITY = 0.08;
const ROOM_EMISSIVE_INTENSITY_MULTIPLIER = 1;
const MONITOR_CLICK_PADDING = 0.08;
const MONITOR_CLICK_DEPTH_TOLERANCE = 0.8;
const DEBUG_SCENE_GRAPH = false; // Disabled the axes and labels!
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
  intensity: 20,
  width: 1.5,
  height: 0.9,
  position: [0, 0, -0.18] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
};
const ROOM_BORDER_LIGHTS = [
  {
    key: "back",
    color: "#ef4444",
    intensity: 14,
    width: 14,
    height: 0.18,
    position: [0.15, 4, -5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    key: "front",
    color: "#ef4444",
    intensity: 7,
    width: 14,
    height: 0.18,
    position: [0.15, 5, 4] as [number, number, number],
    rotation: [20, Math.PI, 0] as [number, number, number],
  },
  {
    key: "right",
    color: "#ef4444",
    intensity: 7,
    width: 10,
    height: 0.18,
    position: [-7, 4.15, 5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
] as const;
const FILMIC_SRGB_MATERIALS = new Set(["material004", "material081", "material082"]);
const RIGHT_POSTER_LIGHT = {
  color: "#ec2020",
  intensity: 8,
  distance: 4,
  decay: 2,
  position: [0.15, 1.75, 4] as [number, number, number],
};
const LAMP_PRACTICAL_LIGHT = {
  bulbColor: "#ffbe6b",
  shadeColor: "#ff9f43",
  bulbIntensity: 2.8,
  bulbDistance: 2.1,
  bulbDecay: 2.2,
  spotIntensity: 16,
  spotDistance: 6.5,
  spotDecay: 2.8,
  spotAngle: 0.5,
  spotPenumbra: 0.78,
};
const REPEATED_TEXTURE_MATERIALS = new Set(["material.012", "material.013"]);

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

function getMonitorFocusPoint(mesh: Mesh) {
  mesh.updateWorldMatrix(true, false);
  const dimensions = getMeshDimensions(mesh);
  const monitorSurfaceZOffset = 0.05;
  const localCenter = new Vector3(
    dimensions.center.x + dimensions.size.x * MONITOR_WEBPAGE_TRANSFORM.position.x,
    dimensions.center.y + dimensions.size.y * MONITOR_WEBPAGE_TRANSFORM.position.y,
    dimensions.frontZ + MONITOR_WEBPAGE_TRANSFORM.position.z + monitorSurfaceZOffset,
  );
  return localCenter.applyMatrix4(mesh.matrixWorld);
}

function getMonitorNormal(mesh: Mesh) {
  mesh.updateWorldMatrix(true, false);
  const normal = new Vector3(0, 0, 1);
  normal.transformDirection(mesh.matrixWorld);
  return normal.normalize();
}

function MonitorSurface({ mesh, url, occludeRef }: MonitorSurfaceProps) {
  const dimensions = useMemo(() => getMeshDimensions(mesh), [mesh]);

  const widthUnits = Math.max(dimensions.size.x * MONITOR_WEBPAGE_TRANSFORM.scale.x, 0.1);
  const heightUnits = Math.max(dimensions.size.y * MONITOR_WEBPAGE_TRANSFORM.scale.y, 0.1);
  const widthPixels = MONITOR_WEBPAGE_TRANSFORM.resolution.width;
  const heightPixels = Math.max(
    MONITOR_WEBPAGE_TRANSFORM.resolution.minHeight,
    Math.round((widthPixels * heightUnits) / widthUnits),
  );
  const htmlScale = widthUnits / widthPixels;

  const zOffset = 0.05; // Pushed slightly forward to prevent self-occlusion

  return (
    <group
      position={[
        dimensions.center.x + dimensions.size.x * MONITOR_WEBPAGE_TRANSFORM.position.x,
        dimensions.center.y + dimensions.size.y * MONITOR_WEBPAGE_TRANSFORM.position.y,
        dimensions.frontZ + MONITOR_WEBPAGE_TRANSFORM.position.z + zOffset,
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
        occlude="blending"
        zIndexRange={[1, 0]}
        scale={htmlScale}
        wrapperClass="ghost-html-container"
        style={{
          width: `${widthPixels}px`,
          height: `${heightPixels}px`,
          pointerEvents: "none", 
          userSelect: "none",
          overflow: "hidden",
          borderRadius: `${MONITOR_WEBPAGE_TRANSFORM.borderRadius}px`,
          background: "#050816",
          boxShadow: "0 0 30px rgba(34, 211, 238, 0.22)",
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
        }} 
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }} />
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
            userSelect: "none",
          }}
        />
      </Html>
    </group>
  );
}

function DebugSceneGraph({ nodes }: { nodes: DebugNodeInfo[] }) {
  return (
    <>
      {nodes.map((node) =>
        createPortal(
          <Fragment key={node.id}>
            <primitive object={new AxesHelper(node.axisSize)} />
            {node.showLabel && (
              <Html
                center
                distanceFactor={7}
                style={{
                  pointerEvents: "none",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: "#f8fafc",
                  background: "rgba(2, 6, 23, 0.78)",
                  border: "1px solid rgba(56, 189, 248, 0.7)",
                  borderRadius: "6px",
                  padding: "2px 5px",
                  whiteSpace: "nowrap",
                  transform: "translateY(-18px)",
                }}
              >
                {node.label}
              </Html>
            )}
          </Fragment>,
          node.object
        ),
      )}
    </>
  );
}

function Room({
  onMonitorClick,
  onSeatClick,
  monitorUrl,
  lampSpotEnabled = true,
  isDay = true,
  ambientIntensity = 0.08,
}: RoomProps) {
  const { gl, camera, scene, pointer } = useThree(); 
  const roomRef = useRef<Group>(null);
  const emissiveMaterialsRef = useRef<MeshStandardMaterial[]>([]);
  const [lampSpotPosition, setLampSpotPosition] = useState<[number, number, number] | null>(null);
  const [lampSpotTarget, setLampSpotTarget] = useState<[number, number, number] | null>(null);
  const lampSpotTargetObject = useMemo(() => new Object3D(), []);
  
  const ktx2Loader = useMemo(
    () => new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl),
    [gl],
  );
  const { scene: gltfScene } = useGLTF(
    "/model-compressed.glb",
    false,
    false,
    (loader: GLTFLoader) => {
      loader.setKTX2Loader(ktx2Loader);
    },
  );
  const [monitorMesh, setMonitorMesh] = useState<Mesh | null>(null);
  
  const debugNodes = useMemo<DebugNodeInfo[]>(() => {
    if (!DEBUG_SCENE_GRAPH) return [];

    const nodes: DebugNodeInfo[] = [];
    gltfScene.traverse((obj) => {
      const label = obj.name || obj.type;
      const lowered = label.toLowerCase();
      const isMesh = (obj as Mesh).isMesh === true;
      const isImportant =
        lowered.includes("room") ||
        lowered.includes("monitor") ||
        lowered.includes("screen") ||
        lowered.includes("seat") ||
        lowered.includes("chair");

      if (!isMesh && !isImportant) return;

      nodes.push({
        id: `${obj.uuid}-debug`,
        label,
        object: obj,
        axisSize: isImportant ? 0.6 : 0.18,
        showLabel: isImportant,
      });
    });

    return nodes;
  }, [gltfScene]);

  useEffect(() => {
    return () => {
      ktx2Loader.dispose();
    };
  }, [ktx2Loader]);

  useEffect(() => {
    if (!roomRef.current) return;

    let lampLightNode: Object3D | null = null;
    let lidNode: Object3D | null = null;

    gltfScene.traverse((obj) => {
      const name = (obj.name || "").toLowerCase();
      if (!lampLightNode && name === "lamplight") {
        lampLightNode = obj;
      }
      if (!lidNode && name === "lid") {
        lidNode = obj;
      }
    });

    if (!lampLightNode || !lidNode) return;

    gltfScene.updateMatrixWorld(true);
    roomRef.current.updateWorldMatrix(true, true);

    const lampWorld = lampLightNode.getWorldPosition(new Vector3());
    const lidWorld = lidNode.getWorldPosition(new Vector3());

    const lampLocal = roomRef.current.worldToLocal(lampWorld.clone());
    const lidLocal = roomRef.current.worldToLocal(lidWorld.clone());

    setLampSpotPosition([lampLocal.x, lampLocal.y, lampLocal.z]);
    setLampSpotTarget([lidLocal.x, lidLocal.y, lidLocal.z]);
  }, [gltfScene]);

  useEffect(() => {
    if (!lampSpotTarget) return;
    lampSpotTargetObject.position.set(
      lampSpotTarget[0],
      lampSpotTarget[1],
      lampSpotTarget[2],
    );
    lampSpotTargetObject.updateMatrixWorld();
  }, [lampSpotTargetObject, lampSpotTarget]);

  useEffect(() => {
    let foundMonitorMesh: Mesh | null = null;
    emissiveMaterialsRef.current = [];

    gltfScene.traverse((obj) => {
      const mesh = obj as Mesh;

      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

        const applyDarkRoomMaterialTuning = (material: unknown) => {
          if (!(material instanceof MeshStandardMaterial)) return;

          const materialName = (material.name || "").toLowerCase();

        material.envMapIntensity = isDay ? DAY_ROOM_ENVIRONMENT_INTENSITY : NIGHT_ROOM_ENVIRONMENT_INTENSITY;
        material.roughness = Math.max(material.roughness, 0.92);
        material.metalness = Math.min(material.metalness, 0.04);
        material.emissiveIntensity *= ROOM_EMISSIVE_INTENSITY_MULTIPLIER;

        if (material.emissiveMap || material.emissiveIntensity > 0 || material.emissive.getHex() !== 0) {
          material.userData.baseEmissiveIntensity =
            typeof material.userData.baseEmissiveIntensity === "number"
              ? material.userData.baseEmissiveIntensity
              : material.emissiveIntensity;
          emissiveMaterialsRef.current.push(material);
        }

          if (REPEATED_TEXTURE_MATERIALS.has(materialName)) {
            const textures = [
              material.map,
            material.emissiveMap,
            material.normalMap,
            material.roughnessMap,
            material.metalnessMap,
            material.aoMap,
          ];

          textures.forEach((texture) => {
            if (!texture) return;
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.repeat.set(-12.8, -12.8);
            texture.rotation = Math.PI / 2;
            texture.center.set(0.5, 0.5);
            texture.needsUpdate = true;
            });
          }

          if (FILMIC_SRGB_MATERIALS.has(materialName)) {
            if (material.map) {
              material.map.colorSpace = SRGBColorSpace;
              material.map.needsUpdate = true;
            }
            if (material.emissiveMap) {
              material.emissiveMap.colorSpace = SRGBColorSpace;
              material.emissiveMap.needsUpdate = true;
            }

            if (!material.userData.filmicSrgbApplied) {
              material.color.convertSRGBToLinear();
              material.emissive.convertSRGBToLinear();
              material.userData.filmicSrgbApplied = true;
            }
            material.roughness = Math.min(material.roughness, 0.42);
            material.metalness = Math.max(material.metalness, 0.08);
            material.envMapIntensity = Math.max(
              material.envMapIntensity,
              isDay ? 1.25 : 0.16,
            );
          }

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
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        liveMonitorMaterial.needsUpdate = true;
        mesh.material = liveMonitorMaterial;
      }
    });

    if (foundMonitorMesh) {
      setMonitorMesh(foundMonitorMesh);
    } else {
      setMonitorMesh(null);
    }
  }, [gltfScene, isDay]);

  useEffect(() => {
    emissiveMaterialsRef.current.forEach((material) => {
      const baseEmissiveIntensity =
        typeof material.userData.baseEmissiveIntensity === "number"
          ? material.userData.baseEmissiveIntensity
          : material.emissiveIntensity;
      material.emissiveIntensity = isDay ? 0 : baseEmissiveIntensity;
      material.needsUpdate = true;
    });
  }, [isDay]);

  // --- CENTER-CAMERA RAYCASTER ---
  useEffect(() => {
    const raycaster = new Raycaster();
    const centerNDC = new Vector2(0, 0);

    const handleGlobalClick = () => {
      const isLocked = document.pointerLockElement !== null;

      if (isLocked) {
        raycaster.setFromCamera(centerNDC, camera);
      } else {
        raycaster.setFromCamera(pointer, camera);
      }

      const intersects = raycaster.intersectObjects(scene.children, true);

      const monitorHit = intersects.find((hit) => {
        const mesh = hit.object as Mesh;
        const isIdentityMatch = !!monitorMesh && (
          mesh.uuid === monitorMesh.uuid || 
          mesh.parent?.uuid === monitorMesh.uuid
        );
        const isNameMatch = (mesh.name || "").toLowerCase().includes("monitor") || 
                            (mesh.name || "").toLowerCase().includes("screen");
        
        return isIdentityMatch || isNameMatch;
      });

      const seatHit = intersects.find((hit) => {
        return (hit.object.name || "").toLowerCase().includes("seat");
      });

      if (monitorHit && monitorMesh) {
        onMonitorClick(getMonitorFocusPoint(monitorMesh), getMonitorNormal(monitorMesh));
      } else if (seatHit) {
        onSeatClick?.(seatHit.point.clone());
      }
    };

    gl.domElement.addEventListener('click', handleGlobalClick);
    return () => gl.domElement.removeEventListener('click', handleGlobalClick);
  }, [gl, camera, scene, pointer, monitorMesh, onMonitorClick, onSeatClick]);

  return (
    <group scale={ROOM_SCALE} position={ROOM_POSITION} ref={roomRef}>
      <ambientLight intensity={ambientIntensity} color={isDay ? "#f8f1e3" : "#cbd5ff"} />
      {!isDay && (
        <pointLight
          color={RIGHT_POSTER_LIGHT.color}
          intensity={RIGHT_POSTER_LIGHT.intensity}
          distance={RIGHT_POSTER_LIGHT.distance}
          decay={RIGHT_POSTER_LIGHT.decay}
          position={RIGHT_POSTER_LIGHT.position}
        />
      )}
      {lampSpotEnabled && lampSpotPosition && lampSpotTarget && (
        <primitive object={lampSpotTargetObject} />
      )}
      {lampSpotEnabled && lampSpotPosition && lampSpotTarget && (
        <pointLight
          position={lampSpotPosition}
          color={LAMP_PRACTICAL_LIGHT.bulbColor}
          intensity={LAMP_PRACTICAL_LIGHT.bulbIntensity}
          distance={LAMP_PRACTICAL_LIGHT.bulbDistance}
          decay={LAMP_PRACTICAL_LIGHT.bulbDecay}
        />
      )}
      {lampSpotEnabled && lampSpotPosition && lampSpotTarget && (
        <spotLight
          position={lampSpotPosition}
          target={lampSpotTargetObject}
          color={LAMP_PRACTICAL_LIGHT.shadeColor}
          intensity={LAMP_PRACTICAL_LIGHT.spotIntensity}
          distance={LAMP_PRACTICAL_LIGHT.spotDistance}
          decay={LAMP_PRACTICAL_LIGHT.spotDecay}
          angle={LAMP_PRACTICAL_LIGHT.spotAngle}
          penumbra={LAMP_PRACTICAL_LIGHT.spotPenumbra}
        />
      )}
      {!isDay &&
        ROOM_BORDER_LIGHTS.map((light) => (
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
        object={gltfScene}
        onPointerOver={(e: any) => {
          const monitorHit = e.intersections.find((hit: any) => {
            const name = (hit.object.name || "").toLowerCase();
            return name.includes("monitor") || name.includes("screen");
          });

          if (monitorHit) {
            const material = monitorHit.object.material;
            if (material instanceof MeshStandardMaterial) {
              material.emissiveIntensity = isDay ? 0 : 0.28;
              material.needsUpdate = true;
            }
          }
        }}
        onPointerOut={(e: any) => {
          const monitorHit = e.intersections.find((hit: any) => {
            const name = (hit.object.name || "").toLowerCase();
            return name.includes("monitor") || name.includes("screen");
          });

          if (monitorHit) {
            const material = monitorHit.object.material;
            if (material instanceof MeshStandardMaterial) {
              material.emissiveIntensity = isDay ? 0 : 0.12;
              material.needsUpdate = true;
            }
          }
        }}
      />

      {monitorMesh && (
        createPortal(
          <Fragment>
            {!isDay && (
              <rectAreaLight
                color={MONITOR_BACKLIGHT.color}
                intensity={MONITOR_BACKLIGHT.intensity}
                width={MONITOR_BACKLIGHT.width}
                height={MONITOR_BACKLIGHT.height}
                position={MONITOR_BACKLIGHT.position}
                rotation={MONITOR_BACKLIGHT.rotation}
              />
            )}
            {monitorUrl && <MonitorSurface mesh={monitorMesh} url={monitorUrl} occludeRef={roomRef} />}
          </Fragment>,
          monitorMesh,
        )
      )}

      {DEBUG_SCENE_GRAPH && <DebugSceneGraph nodes={debugNodes} />}
    </group>
  );
}

export default memo(Room);
