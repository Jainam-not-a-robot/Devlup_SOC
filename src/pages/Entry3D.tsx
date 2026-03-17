import { RefObject, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, useGLTF, useTexture } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import {
  AdditiveBlending,
  Euler,
  Float32BufferAttribute,
  Material,
  MathUtils,
  Mesh,
  Object3D,
  Points,
  BufferGeometry,
  PerspectiveCamera,
  SRGBColorSpace,
  Texture,
  PointsMaterial,
  Vector2,
  Vector3,
} from "three";

type CameraAnchors = {
  cameraPosition: Vector3;
  lookAt: Vector3;
};

type ScreenMaterial = Material & {
  map?: Texture | null;
  emissiveMap?: Texture | null;
  emissive?: { set: (value: string) => void };
  emissiveIntensity?: number;
  needsUpdate?: boolean;
};

const MONITOR_KEYWORDS = ["monitor", "screen", "display"];

type WalkBoundary = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type BlockedZone = WalkBoundary & {
  name: string;
};

const WALKABLE_AREA: WalkBoundary = {
  minX: -4.65,
  maxX: 6.25,
  minZ: -8.74,
  maxZ: 1.70,
};

const BLOCKED_ZONES: BlockedZone[] = [
  // Add or tune zones here while testing.
  // Example:
  // { name: "desk", minX: -1.8, maxX: 1.8, minZ: -3.2, maxZ: -1.4 },
];

const PLAYER_RADIUS = 0.35;
const LAST_CONTENT_ROUTE_KEY = "devlup:last-content-route";
const INITIAL_SPAWN = {
  x: 0.78,
  y: 1.65,
  z: -2.69,
};
const SNOW_AREA = {
  minX: -5.57,
  maxX: 9.25,
  minY: -6.5,
  maxY: 6.5,
  minZ: 5.0,
  maxZ: 10,
};
const SNOW_PARTICLE_COUNT = 350;
const SNOW_FALL_SPEED = { min: 0.45, max: 1.35 };
const SNOW_DRIFT_SPEED = 0.18;
const SNOW_FLAKE_SIZE = 0.08;

function clampToWalkableArea(position: Vector3, boundary: WalkBoundary) {
  position.x = MathUtils.clamp(position.x, boundary.minX, boundary.maxX);
  position.z = MathUtils.clamp(position.z, boundary.minZ, boundary.maxZ);
}

function intersectsBlockedZone(position: Vector3, zones: BlockedZone[], radius: number) {
  return zones.some(
    (zone) =>
      position.x + radius > zone.minX &&
      position.x - radius < zone.maxX &&
      position.z + radius > zone.minZ &&
      position.z - radius < zone.maxZ
  );
}

function isMonitorObject(object: Object3D) {
  const mesh = object as Mesh;
  const name = mesh.name?.toLowerCase?.() || "";
  const material = mesh.material;
  const materialNames = Array.isArray(material)
    ? material.map((m) => m?.name?.toLowerCase?.() || "").join(" ")
    : material?.name?.toLowerCase?.() || "";
  return MONITOR_KEYWORDS.some((keyword) => `${name} ${materialNames}`.includes(keyword));
}

function applyScreenTexture(material: ScreenMaterial, texture: Texture) {
  material.map = texture;
  material.emissiveMap = texture;
  material.emissive?.set?.("#ffffff");
  material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.4);
  material.needsUpdate = true;
}

function Model({
  isEntering,
  isPointerLocked,
  onMonitorClick,
  onAnchorsReady,
}: {
  isEntering: boolean;
  isPointerLocked: boolean;
  onMonitorClick: (point: Vector3) => void;
  onAnchorsReady: (anchors: CameraAnchors) => void;
}) {
  const { scene } = useGLTF("/model.glb");
  const screenTexture = useTexture("/screenshots/screenshot.png");
  const [hoveringMonitor, setHoveringMonitor] = useState(false);
  const modelScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    screenTexture.colorSpace = SRGBColorSpace;
    screenTexture.flipY = false;
    screenTexture.center = new Vector2(0.5, 0.5);
    screenTexture.rotation = Math.PI;
    screenTexture.needsUpdate = true;
  }, [screenTexture]);

  useEffect(() => {
    modelScene.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!isMonitorObject(mesh)) return;

      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((m) => applyScreenTexture(m as ScreenMaterial, screenTexture));
      } else if (material) {
        applyScreenTexture(material as ScreenMaterial, screenTexture);
      }
    });

    modelScene.updateMatrixWorld(true);
    const cameraNode = modelScene.getObjectByName("Camera");
    const pivotNode = modelScene.getObjectByName("CameraPivot");

    if (!cameraNode) return;

    const cameraPosition = new Vector3();
    cameraNode.getWorldPosition(cameraPosition);
    const lookAt = new Vector3();

    if (pivotNode) {
      pivotNode.getWorldPosition(lookAt);
    } else {
      cameraNode.getWorldDirection(lookAt).multiplyScalar(3).add(cameraPosition);
    }

    onAnchorsReady({ cameraPosition, lookAt });
  }, [modelScene, onAnchorsReady, screenTexture]);

  useEffect(() => {
    document.body.style.cursor = hoveringMonitor ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hoveringMonitor]);

  return (
    <primitive
      object={modelScene}
      scale={0.5}
      position={[0, -1, 0]}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        if (isEntering || isPointerLocked) return;
        const nextHovering = isMonitorObject(event.object);
        setHoveringMonitor((prev) => (prev === nextHovering ? prev : nextHovering));
      }}
      onPointerOut={() => setHoveringMonitor(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (isEntering || !isMonitorObject(event.object)) return;
        event.stopPropagation();
        onMonitorClick(event.point.clone());
      }}
    />
  );
}

function FirstPersonController({
  enabled,
  anchors,
  controlsRef,
}: {
  enabled: boolean;
  anchors: CameraAnchors | null;
  controlsRef: RefObject<PointerLockControlsImpl | null>;
}) {
  const { camera } = useThree();
  const baseYRef = useRef(1.65);
  const bobTimeRef = useRef(0);
  const initializedRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const forwardRef = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const nextPositionRef = useRef(new Vector3());
  const candidateXRef = useRef(new Vector3());
  const candidateZRef = useRef(new Vector3());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;

    if (anchors) {
      camera.position.set(INITIAL_SPAWN.x, anchors.cameraPosition.y, INITIAL_SPAWN.z);
      camera.lookAt(anchors.lookAt);
      baseYRef.current = anchors.cameraPosition.y;
    } else {
      camera.position.set(INITIAL_SPAWN.x, INITIAL_SPAWN.y, INITIAL_SPAWN.z);
      camera.lookAt(0, INITIAL_SPAWN.y, 0);
      baseYRef.current = INITIAL_SPAWN.y;
    }

    initializedRef.current = true;
  }, [anchors, camera]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const controls = controlsRef.current;
    if (!controls?.isLocked) return;

    const keys = keysRef.current;
    const speed = keys.ShiftLeft || keys.ShiftRight ? 3.6 : 2.3;
    const forwardInput = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const sideInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const moving = forwardInput !== 0 || sideInput !== 0;

    if (moving) {
      const len = Math.hypot(sideInput, forwardInput);
      const normSide = sideInput / len;
      const normForward = forwardInput / len;
      const step = speed * delta;

      camera.getWorldDirection(forwardRef.current);
      forwardRef.current.y = 0;

      if (forwardRef.current.lengthSq() > 0) {
        forwardRef.current.normalize();
        rightRef.current.set(forwardRef.current.z, 0, -forwardRef.current.x);

        nextPositionRef.current.copy(camera.position);
        nextPositionRef.current.addScaledVector(rightRef.current, normSide * step);
        nextPositionRef.current.addScaledVector(forwardRef.current, normForward * step);
        clampToWalkableArea(nextPositionRef.current, WALKABLE_AREA);

        if (!intersectsBlockedZone(nextPositionRef.current, BLOCKED_ZONES, PLAYER_RADIUS)) {
          camera.position.x = nextPositionRef.current.x;
          camera.position.z = nextPositionRef.current.z;
        } else {
          candidateXRef.current.set(nextPositionRef.current.x, camera.position.y, camera.position.z);
          clampToWalkableArea(candidateXRef.current, WALKABLE_AREA);

          if (!intersectsBlockedZone(candidateXRef.current, BLOCKED_ZONES, PLAYER_RADIUS)) {
            camera.position.x = candidateXRef.current.x;
          }

          candidateZRef.current.set(camera.position.x, camera.position.y, nextPositionRef.current.z);
          clampToWalkableArea(candidateZRef.current, WALKABLE_AREA);

          if (!intersectsBlockedZone(candidateZRef.current, BLOCKED_ZONES, PLAYER_RADIUS)) {
            camera.position.z = candidateZRef.current.z;
          }
        }
      }

      bobTimeRef.current += delta * (speed > 3 ? 16 : 11);
    } else {
      bobTimeRef.current = Math.max(0, bobTimeRef.current - delta * 8);
    }

    camera.position.y = baseYRef.current + Math.sin(bobTimeRef.current) * (moving ? 0.03 : 0);
    clampToWalkableArea(camera.position, WALKABLE_AREA);
  });

  return null;
}

function SmoothedMouseLook({
  enabled,
  controlsRef,
}: {
  enabled: boolean;
  controlsRef: RefObject<PointerLockControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);
  const currentYawRef = useRef(0);
  const currentPitchRef = useRef(0);
  const wasLockedRef = useRef(false);

  const syncFromCamera = () => {
    const euler = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
    targetYawRef.current = euler.y;
    targetPitchRef.current = euler.x;
    currentYawRef.current = euler.y;
    currentPitchRef.current = euler.x;
  };

  useEffect(() => {
    syncFromCamera();
  }, [camera]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const controls = controlsRef.current;
      if (!enabled || !controls?.isLocked) return;

      const dx = MathUtils.clamp(event.movementX, -28, 28);
      const dy = MathUtils.clamp(event.movementY, -28, 28);
      const sensitivity = 0.0014;
      const maxPitch = Math.PI / 2 - 0.08;

      targetYawRef.current -= dx * sensitivity;
      targetPitchRef.current = MathUtils.clamp(targetPitchRef.current - dy * sensitivity, -maxPitch, maxPitch);
    };

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [controlsRef, enabled]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const locked = !!controls?.isLocked;

    if (!wasLockedRef.current && locked) {
      syncFromCamera();
    }
    wasLockedRef.current = locked;

    if (!enabled || !locked) return;

    const blend = 1 - Math.exp(-18 * delta);
    currentYawRef.current += (targetYawRef.current - currentYawRef.current) * blend;
    currentPitchRef.current += (targetPitchRef.current - currentPitchRef.current) * blend;
    camera.quaternion.setFromEuler(new Euler(currentPitchRef.current, currentYawRef.current, 0, "YXZ"));
  });

  return null;
}

function CameraZoomTransition({
  targetPoint,
  controlsRef,
  onComplete,
}: {
  targetPoint: Vector3 | null;
  controlsRef: RefObject<PointerLockControlsImpl | null>;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const transitionRef = useRef({
    active: false,
    elapsed: 0,
    completed: false,
    startPos: new Vector3(),
    endPos: new Vector3(),
    startFov: 55,
    endFov: 47,
  });

  useEffect(() => {
    if (!targetPoint) return;

    const perspectiveCamera = camera as PerspectiveCamera;
    const transition = transitionRef.current;
    const direction = targetPoint.clone().sub(camera.position).normalize();

    transition.active = true;
    transition.elapsed = 0;
    transition.completed = false;
    transition.startPos = camera.position.clone();
    transition.endPos = targetPoint.clone().sub(direction.multiplyScalar(0.62));
    transition.startFov = perspectiveCamera.fov;
    transition.endFov = Math.max(40, perspectiveCamera.fov - 8);

    controlsRef.current?.unlock();
  }, [camera, controlsRef, targetPoint]);

  useFrame((_, delta) => {
    const perspectiveCamera = camera as PerspectiveCamera;
    const transition = transitionRef.current;
    if (!transition.active) return;

    transition.elapsed += delta;
    const t = Math.min(transition.elapsed / 1.35, 1);
    const eased = t * t * t * (t * (t * 6 - 15) + 10);

    camera.position.lerpVectors(transition.startPos, transition.endPos, eased);
    perspectiveCamera.fov = transition.startFov + (transition.endFov - transition.startFov) * eased;
    perspectiveCamera.updateProjectionMatrix();

    if (t >= 1 && !transition.completed) {
      transition.completed = true;
      transition.active = false;
      onComplete();
    }
  });

  return null;
}

function SnowField() {
  const pointsRef = useRef<Points<BufferGeometry, PointsMaterial> | null>(null);
  const geometryRef = useRef<BufferGeometry | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const driftOffsetsRef = useRef<Float32Array | null>(null);

  const positions = useMemo(() => {
    const values = new Float32Array(SNOW_PARTICLE_COUNT * 3);
    const velocities = new Float32Array(SNOW_PARTICLE_COUNT);
    const driftOffsets = new Float32Array(SNOW_PARTICLE_COUNT);

    for (let i = 0; i < SNOW_PARTICLE_COUNT; i += 1) {
      const index = i * 3;
      values[index] = MathUtils.lerp(SNOW_AREA.minX, SNOW_AREA.maxX, Math.random());
      values[index + 1] = MathUtils.lerp(SNOW_AREA.minY, SNOW_AREA.maxY, Math.random());
      values[index + 2] = MathUtils.lerp(SNOW_AREA.minZ, SNOW_AREA.maxZ, Math.random());
      velocities[i] = MathUtils.lerp(SNOW_FALL_SPEED.min, SNOW_FALL_SPEED.max, Math.random());
      driftOffsets[i] = Math.random() * Math.PI * 2;
    }

    velocitiesRef.current = velocities;
    driftOffsetsRef.current = driftOffsets;

    return values;
  }, []);

  useEffect(() => {
    if (!geometryRef.current) return;

    geometryRef.current.setAttribute("position", new Float32BufferAttribute(positions, 3));
  }, [positions]);

  useFrame((_, delta) => {
    const geometry = geometryRef.current;
    const velocities = velocitiesRef.current;
    const driftOffsets = driftOffsetsRef.current;
    if (!geometry || !velocities || !driftOffsets) return;

    const attribute = geometry.getAttribute("position");
    if (!attribute) return;

    const array = attribute.array as Float32Array;
    const height = SNOW_AREA.maxY - SNOW_AREA.minY;
    const width = SNOW_AREA.maxX - SNOW_AREA.minX;
    const depth = SNOW_AREA.maxZ - SNOW_AREA.minZ;

    for (let i = 0; i < SNOW_PARTICLE_COUNT; i += 1) {
      const index = i * 3;
      array[index + 1] -= velocities[i] * delta;
      array[index] += Math.sin(performance.now() * 0.0015 + driftOffsets[i]) * SNOW_DRIFT_SPEED * delta;
      array[index + 2] += Math.cos(performance.now() * 0.001 + driftOffsets[i]) * (SNOW_DRIFT_SPEED * 0.55) * delta;

      if (array[index + 1] < SNOW_AREA.minY) {
        array[index] = MathUtils.lerp(SNOW_AREA.minX, SNOW_AREA.maxX, Math.random());
        array[index + 1] = SNOW_AREA.maxY;
        array[index + 2] = MathUtils.lerp(SNOW_AREA.minZ, SNOW_AREA.maxZ, Math.random());
      } else {
        if (array[index] < SNOW_AREA.minX) array[index] += width;
        if (array[index] > SNOW_AREA.maxX) array[index] -= width;
        if (array[index + 2] < SNOW_AREA.minZ) array[index + 2] += depth;
        if (array[index + 2] > SNOW_AREA.maxZ) array[index + 2] -= depth;
      }
    }

    attribute.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        color="#f4fbff"
        size={SNOW_FLAKE_SIZE}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function CameraPositionDebug({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (position: { x: number; y: number; z: number }) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!enabled) return;

    onChange({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    });
  });

  return null;
}

export default function Entry3D() {
  const navigate = useNavigate();
  const pointerLockRef = useRef<PointerLockControlsImpl | null>(null);
  const [zoomTarget, setZoomTarget] = useState<Vector3 | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [anchors, setAnchors] = useState<CameraAnchors | null>(null);
  const [cameraDebug, setCameraDebug] = useState({ x: 0, y: 0, z: 0 });
  const entryTargetRef = useRef("/home");

  useEffect(() => {
    const savedRoute = window.sessionStorage.getItem(LAST_CONTENT_ROUTE_KEY);
    entryTargetRef.current =
      savedRoute && savedRoute !== "/" && savedRoute !== "/entry" ? savedRoute : "/home";
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas camera={{ position: [INITIAL_SPAWN.x, INITIAL_SPAWN.y, INITIAL_SPAWN.z], fov: 55 }}>
        <hemisphereLight args={["#a9c4ea", "#1a2233", 0.9]} />
        <SnowField />

        <Suspense fallback={null}>
          <Model
            isEntering={isEntering}
            isPointerLocked={isPointerLocked}
            onMonitorClick={(point) => {
              if (isEntering) return;
              setIsEntering(true);
              setZoomTarget(point);
            }}
            onAnchorsReady={setAnchors}
          />
        </Suspense>

        <FirstPersonController enabled={!isEntering} anchors={anchors} controlsRef={pointerLockRef} />
        <SmoothedMouseLook enabled={!isEntering} controlsRef={pointerLockRef} />
        <PointerLockControls
          ref={pointerLockRef}
          enabled={!isEntering}
          pointerSpeed={0}
          onLock={() => setIsPointerLocked(true)}
          onUnlock={() => setIsPointerLocked(false)}
        />

        <CameraZoomTransition
          targetPoint={zoomTarget}
          controlsRef={pointerLockRef}
          onComplete={() => navigate(entryTargetRef.current)}
        />
        <CameraPositionDebug enabled={!isEntering} onChange={setCameraDebug} />
      </Canvas>

      {!isEntering && (
        <div className="pointer-events-none absolute right-4 top-4 min-w-44 rounded-md border border-cyan-300/30 bg-black/45 px-4 py-3 text-xs text-cyan-100/90 backdrop-blur-sm">
          <p className="mb-1 font-semibold tracking-wide text-cyan-200">Camera Debug</p>
          <p>x: {cameraDebug.x.toFixed(2)}</p>
          <p>y: {cameraDebug.y.toFixed(2)}</p>
          <p>z: {cameraDebug.z.toFixed(2)}</p>
        </div>
      )}

      {!isEntering && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-md border border-cyan-300/30 bg-black/45 px-4 py-3 text-xs text-cyan-100/90 backdrop-blur-sm">
          <p className="mb-1 font-semibold tracking-wide text-cyan-200">How to Enter</p>
          <p>1. Click anywhere to lock mouse and look around.</p>
          <p>2. Use WASD to move and Shift to sprint.</p>
          <p>3. Face the monitor and click it to enter.</p>
        </div>
      )}

      {!isEntering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full border border-cyan-300/80 bg-cyan-300/20 shadow-[0_0_10px_#22d3ee]" />
        </div>
      )}

      {!isEntering && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-cyan-300/30 bg-black/40 px-3 py-1 text-xs tracking-wide text-cyan-100/85 backdrop-blur-sm">
          Click to lock mouse - WASD to walk - Shift to sprint
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/model.glb");
useTexture.preload("/screenshots/screenshot.png");
