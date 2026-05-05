import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Environment } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  MathUtils,
  Object3D,
  ShaderMaterial,
  Vector3,
} from "three";

import Home from "./Home";
import Room from "../components/Room";
import Player from "../components/Player";
import Snow from "../components/Snow";
import PortalEnter from "../components/PortalEnter";
import SmoothPointerLockControls from "../components/SmoothPointerLockControls";
import EntryInstructionHUD, {
  getNearestEntryHint,
  type EntryHintZone,
  type EntryInstructionHint,
} from "../components/EntryInstructionHUD";
import ProximityInteraction, {
  type InteractionTarget,
} from "../components/ProximityInteraction";
import {
  LAST_CONTENT_ROUTE_KEY,
  MONITOR_EMBED_QUERY_KEY,
  MONITOR_EMBED_QUERY_VALUE,
} from "../constants/navigation";
import { useDayNightCycle } from "../hooks/useDayNightCycle";
import { isSummer, isWinter } from "../config/sceneTheme";

const ENTRY_BOUNDARY_PADDING = {
  tableFrontZ: 0.18,
};

const ENTRY_ROOM_BOUNDARIES = {
  x: { min: -5.2, max: 6.25 },
  z: {
    min: -10.10,
    max: -1.081 - ENTRY_BOUNDARY_PADDING.tableFrontZ,
  },
  standingHeight: 1.6,
};

const ENTRY_SPAWN_POINT = {
  x: 2.04,
  y: ENTRY_ROOM_BOUNDARIES.standingHeight,
  z: -2.17,
};

const ENTRY_MONITOR_TARGET = {
  x: 0.86,
  y: -1,
  z: 0,
};
const ENTRY_MONITOR_DEFAULT_NORMAL = new Vector3(0, 0, 1);

const ENTRY_SEAT_INTERACTION_POSITION: [number, number, number] = [0.47, 1.6, -2.05];
const ENTRY_INTERACTION_RANGE = 1.45;

const ENTRY_SEAT_SETTINGS = {
  position: {
    x: 0.38,
    y: -0.5,
    z: -2.38,
  },
};

const ENTRY_SNOW_AREA = {
  x: { min: -7.0, max: 9.0 },
  y: { min: -10, max: 10 },
  z: { min: 5, max: 9 },
};

const ENTRY_SNOW_SETTINGS = {
  area: ENTRY_SNOW_AREA,
  particleCount: 300,
  fallSpeed: 0.02,
  size: 0.1,
};
const CAMERA_COORDINATE_UPDATE_INTERVAL = 1 / 4;
const DAY_NIGHT_TRANSITION_SPEED = 0.04;
const ENTRY_QUICK_START_AUTO_HIDE_MS = 8000;
const WINDOW_LIGHT_POSITION: [number, number, number] = [-7.4, 4.9, 4.8];
const WINDOW_LIGHT_TARGET: [number, number, number] = [0.4, 1.6, -2.4];
const SUMMER_SUN_LIGHT_POSITION: [number, number, number] = [-3.2, 7.2, 8.8];
const SUMMER_SUN_LIGHT_TARGET: [number, number, number] = [1.8, 0.6, -3.6];
const WINTER_FOG_COLOR = "#9eb4c7";
const WINTER_WINDOW_BEAM_COLOR = "#ffe2b8";
const ENTRY_CONTEXT_HINT_RANGES = {
  lamp: 1.65,
  monitor: 1.85,
};

type Coordinates = {
  x: number;
  y: number;
  z: number;
};

type EntryInteractionHintPoints = {
  lamp?: [number, number, number];
  monitor?: [number, number, number];
};

function areHintPointsEqual(
  current: EntryInteractionHintPoints,
  next: EntryInteractionHintPoints,
) {
  const pointKeys: Array<keyof EntryInteractionHintPoints> = ["lamp", "monitor"];

  return pointKeys.every((key) => {
    const currentPoint = current[key];
    const nextPoint = next[key];

    if (!currentPoint && !nextPoint) return true;
    if (!currentPoint || !nextPoint) return false;

    return currentPoint.every((value, index) => value === nextPoint[index]);
  });
}

function SeatedCameraLock({ position }: { position: Vector3 }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.copy(position);
  });

  return null;
}

function applyEntryRoomBoundaries(position: Vector3) {
  position.x = Math.min(ENTRY_ROOM_BOUNDARIES.x.max, Math.max(ENTRY_ROOM_BOUNDARIES.x.min, position.x));
  position.z = Math.min(ENTRY_ROOM_BOUNDARIES.z.max, Math.max(ENTRY_ROOM_BOUNDARIES.z.min, position.z));
  position.y = Math.max(ENTRY_ROOM_BOUNDARIES.standingHeight - 0.04, position.y);
}

function CameraCoordinatesTracker({
  onChange,
}: {
  onChange: (coords: Coordinates) => void;
}) {
  const { camera } = useThree();
  const elapsedRef = useRef(0);
  const lastSnapshotRef = useRef("");

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current < CAMERA_COORDINATE_UPDATE_INTERVAL) return;
    elapsedRef.current = 0;

    const next = {
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
    };
    const snapshot = `${next.x}|${next.y}|${next.z}`;
    if (snapshot === lastSnapshotRef.current) return;

    lastSnapshotRef.current = snapshot;
    onChange(next);
  });

  return null;
}

function DayNightScene({
  isDay,
  sunIntensity,
  environmentMap,
  isWinterTheme,
}: ReturnType<typeof useDayNightCycle> & { isWinterTheme: boolean }) {
  const windowLightRef = useRef<any>(null);
  const windowLightTarget = useMemo(() => new Object3D(), []);
  const nextLightColor = useMemo(() => new Color(), []);
  const activeLightPosition = isWinterTheme || !isDay ? WINDOW_LIGHT_POSITION : SUMMER_SUN_LIGHT_POSITION;
  const activeLightTarget = isWinterTheme || !isDay ? WINDOW_LIGHT_TARGET : SUMMER_SUN_LIGHT_TARGET;

  useEffect(() => {
    windowLightTarget.position.set(
      activeLightTarget[0],
      activeLightTarget[1],
      activeLightTarget[2],
    );
    windowLightTarget.updateMatrixWorld();
  }, [activeLightTarget, windowLightTarget]);

  useFrame(() => {
    if (windowLightRef.current) {
      const lightColor = isWinterTheme
        ? (isDay ? "#d8e6f2" : WINTER_WINDOW_BEAM_COLOR)
        : (isDay ? "#ffe7b0" : "#ffc98a");

      windowLightRef.current.intensity = MathUtils.lerp(
        windowLightRef.current.intensity,
        sunIntensity,
        DAY_NIGHT_TRANSITION_SPEED,
      );
      nextLightColor.set(lightColor);
      windowLightRef.current.color.lerp(nextLightColor, DAY_NIGHT_TRANSITION_SPEED);
    }
  });

  return (
    <>
      <Environment
        key={environmentMap}
        files={environmentMap}
        background
        backgroundIntensity={isDay ? (isWinterTheme ? 0.85 : 1.28) : 0.18}
        environmentIntensity={isDay ? (isWinterTheme ? 0.95 : 1.58) : (isWinterTheme ? 0.08 : 0.12)}
      />
      <primitive object={windowLightTarget} />
      <directionalLight
        ref={windowLightRef}
        position={activeLightPosition}
        target={windowLightTarget}
        castShadow
        intensity={sunIntensity}
        color={isWinterTheme ? (isDay ? "#d8e6f2" : WINTER_WINDOW_BEAM_COLOR) : (isDay ? "#ffe7b0" : "#ffc98a")}
        shadow-mapSize-width={isWinterTheme ? 1024 : 1536}
        shadow-mapSize-height={isWinterTheme ? 1024 : 1536}
        shadow-bias={-0.00022}
        shadow-radius={isWinterTheme ? 8 : 2}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      {isWinterTheme && isDay && (
        <>
          <AtmosphericFogVolume />
          <VolumetricLightBeam
            start={WINDOW_LIGHT_POSITION}
            target={WINDOW_LIGHT_TARGET}
            color={WINTER_WINDOW_BEAM_COLOR}
            radius={3.8}
            opacity={0.1}
          />
        </>
      )}
    </>
  );
}

function AtmosphericFogVolume() {
  const { camera } = useThree();
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: BackSide,
        uniforms: {
          fogColor: { value: new Color(WINTER_FOG_COLOR) },
          cameraPositionWorld: { value: new Vector3() },
          baseDensity: { value: 0.09 },
          groundDensity: { value: 0.18 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;

          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vWorldPosition;

          uniform vec3 fogColor;
          uniform vec3 cameraPositionWorld;
          uniform float baseDensity;
          uniform float groundDensity;

          void main() {
            float distanceToCamera = distance(cameraPositionWorld, vWorldPosition);
            float distanceFactor = clamp(distanceToCamera / 28.0, 0.0, 1.0);
            float nearGround = 1.0 - smoothstep(-0.5, 9.0, vWorldPosition.y);
            float density = mix(baseDensity, groundDensity, nearGround);
            float alpha = density * (0.3 + distanceFactor * 0.9);
            alpha = clamp(alpha, 0.0, 0.18);
            gl_FragColor = vec4(fogColor, alpha);
          }
        `,
      }),
    [],
  );

  useFrame(() => {
    material.uniforms.cameraPositionWorld.value.copy(camera.position);
  });

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <>
      <mesh position={[0, 3, -1]} scale={[26, 15, 26]} frustumCulled={false}>
        <sphereGeometry args={[1, 40, 24]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, -1]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <circleGeometry args={[18, 48]} />
        <meshBasicMaterial color={WINTER_FOG_COLOR} transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </>
  );
}

function VolumetricLightBeam({
  start,
  target,
  color,
  radius,
  opacity,
}: {
  start: [number, number, number];
  target: [number, number, number];
  color: string;
  radius: number;
  opacity: number;
}) {
  const beamRef = useRef<Group>(null);
  const source = useMemo(() => new Vector3(...start), [start]);
  const destination = useMemo(() => new Vector3(...target), [target]);
  const length = useMemo(() => source.distanceTo(destination), [destination, source]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          beamColor: { value: new Color(color) },
          maxRadius: { value: radius },
          beamOpacity: { value: opacity },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vLocalPosition;

          void main() {
            vUv = uv;
            vLocalPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vLocalPosition;

          uniform vec3 beamColor;
          uniform float maxRadius;
          uniform float beamOpacity;

          void main() {
            float axialFade = pow(1.0 - vUv.y, 1.35);
            float coneRadius = max(0.15, maxRadius * (1.0 - vUv.y));
            float radial = length(vLocalPosition.xz) / coneRadius;
            float radialFade = pow(max(0.0, 1.0 - radial), 2.4);
            float alpha = radialFade * axialFade * beamOpacity;
            if (alpha <= 0.001) discard;
            gl_FragColor = vec4(beamColor, alpha);
          }
        `,
      }),
    [color, opacity, radius],
  );

  useEffect(() => {
    if (!beamRef.current) return;
    beamRef.current.position.copy(source);
    beamRef.current.lookAt(destination);
  }, [destination, source]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <group ref={beamRef}>
      <mesh position={[0, 0, -length * 0.5]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <coneGeometry args={[radius, length, 28, 1, true]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

export default function Entry3D() {
  const navigate = useNavigate();
  const dayNightCycle = useDayNightCycle();
  const toneMappingExposure = dayNightCycle.isDay
    ? (isWinter ? 0.24 : 0.34)
    : (isWinter ? 0.18 : 0.23);
  
  const [isEntering, setIsEntering] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Vector3 | null>(null);
  const [seatPosition, setSeatPosition] = useState<Vector3 | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<InteractionTarget | null>(null);
  const [lampSpotEnabled, setLampSpotEnabled] = useState(true);
  const lampSpotEnabledRef = useRef(lampSpotEnabled);
  const [quickStartVisible, setQuickStartVisible] = useState(true);
  const [instructionPanelVisible, setInstructionPanelVisible] = useState(false);
  const [interactionHintPoints, setInteractionHintPoints] = useState<EntryInteractionHintPoints>({});
  const [coordinates, setCoordinates] = useState<Coordinates>({
    x: ENTRY_SPAWN_POINT.x,
    y: ENTRY_SPAWN_POINT.y,
    z: ENTRY_SPAWN_POINT.z,
  });
  
  const returnRoute = useMemo(
    () => window.sessionStorage.getItem(LAST_CONTENT_ROUTE_KEY) || "/home",
    [],
  );
  
  const monitorUrl = useMemo(() => {
    const url = new URL(returnRoute, window.location.origin);
    url.searchParams.set(MONITOR_EMBED_QUERY_KEY, MONITOR_EMBED_QUERY_VALUE);
    return `${url.pathname}${url.search}${url.hash}`;
  }, [returnRoute]);
  
  const handlePortalFinish = useCallback(() => {
    navigate(returnRoute);
  }, [navigate, returnRoute]);

  useEffect(() => {
    lampSpotEnabledRef.current = lampSpotEnabled;
  }, [lampSpotEnabled]);

  const handleInteractionHintPointsChange = useCallback((points: EntryInteractionHintPoints) => {
    setInteractionHintPoints((currentPoints) =>
      areHintPointsEqual(currentPoints, points) ? currentPoints : points,
    );
  }, []);

  const handleLampClick = useCallback(() => {
    const nextLampState = !lampSpotEnabledRef.current;
    lampSpotEnabledRef.current = nextLampState;
    setLampSpotEnabled(nextLampState);
  }, []);

  const handleMonitorInteract = useCallback((point?: Vector3, normal?: Vector3) => {
    if (isEntering) return;
    setSeatPosition(null);
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    const targetPoint = point 
      ? new Vector3(point.x, point.y, point.z)
      : new Vector3(ENTRY_MONITOR_TARGET.x, ENTRY_MONITOR_TARGET.y, ENTRY_MONITOR_TARGET.z);
      
    const outwardNormal = normal?.clone() ?? ENTRY_MONITOR_DEFAULT_NORMAL.clone();

    setPortalTarget(targetPoint);
    setIsEntering(true);
  }, [isEntering]);

  const handleSeatInteract = useCallback(() => {
    if (isEntering) return;

    setSeatPosition(
      new Vector3(
        ENTRY_SEAT_SETTINGS.position.x,
        ENTRY_SEAT_SETTINGS.position.y,
        ENTRY_SEAT_SETTINGS.position.z,
      ),
    );

    // INSTANT LOCK: Automatically trigger viewing mode when you sit down
    const canvas = document.querySelector('canvas');
    if (canvas && document.pointerLockElement === null) {
      canvas.requestPointerLock();
    }

  }, [isEntering]);

  const handleStandUp = useCallback(() => {
    setSeatPosition(null);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);
  
  const interactionTargets = useMemo<InteractionTarget[]>(
    () => [
      {
        id: "seat",
        label: "Chair",
        prompt: "Press Enter to sit",
        position: ENTRY_SEAT_INTERACTION_POSITION,
        range: ENTRY_INTERACTION_RANGE,
        onInteract: handleSeatInteract,
      },
    ],
    [handleSeatInteract],
  );
  
  const isSeated = !!seatPosition;
  const shouldWarmHome = isEntering && returnRoute === "/home";
  const playerStatus = useMemo<EntryInstructionHint>(() => {
    if (isEntering) {
      return {
        id: "player-entering",
        label: "Player Status",
        message: "Entering portal",
        tone: "action",
        icon: "monitor",
        details: [
          {
            label: "Lamp",
            message: lampSpotEnabled ? "On" : "Off",
            icon: "lamp",
          },
        ],
      };
    }

    return {
      id: isSeated ? "player-seated" : "player-standing",
      label: "Player Status",
      message: isSeated ? "Seated" : "Standing",
      tone: isSeated ? "action" : "movement",
      icon: "chair",
      details: [
        {
          label: "Lamp",
          message: lampSpotEnabled ? "On" : "Off",
          icon: "lamp",
        },
      ],
    };
  }, [isEntering, isSeated, lampSpotEnabled]);

  const entryContextHint = useMemo<EntryInstructionHint | null>(() => {
    if (isEntering) return null;

    if (isSeated) {
      return {
        id: "seated",
        label: "Seated",
        message: "to stand up",
        keys: ["SPACE"],
        tone: "action",
        icon: "chair",
      };
    }

    if (activeInteraction?.id === "seat") {
      return {
        id: "chair",
        label: "Chair",
        message: "to sit",
        keys: ["ENTER"],
        tone: "interaction",
        icon: "chair",
      };
    }

    const hintZones: EntryHintZone[] = [];

    if (interactionHintPoints.lamp) {
      hintZones.push({
        id: "lamp",
        label: "Lamp",
        message: lampSpotEnabled ? "lamp to turn off" : "lamp to turn on",
        keys: ["CLICK"],
        tone: "interaction",
        icon: "lamp",
        position: interactionHintPoints.lamp,
        range: ENTRY_CONTEXT_HINT_RANGES.lamp,
        priority: 1,
      });
    }

    if (interactionHintPoints.monitor) {
      hintZones.push({
        id: "monitor",
        label: "Monitor",
        message: "monitor to enter main website",
        keys: ["CLICK"],
        tone: "action",
        icon: "monitor",
        position: interactionHintPoints.monitor,
        range: ENTRY_CONTEXT_HINT_RANGES.monitor,
        priority: 2,
      });
    }

    return getNearestEntryHint({ x: coordinates.x, z: coordinates.z }, hintZones);
  }, [
    activeInteraction,
    coordinates.x,
    coordinates.z,
    interactionHintPoints,
    isEntering,
    isSeated,
    lampSpotEnabled,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuickStartVisible(false);
    }, ENTRY_QUICK_START_AUTO_HIDE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (event.code === "KeyH") {
        event.preventDefault();
        setInstructionPanelVisible((isVisible) => !isVisible);
        return;
      }

      if (event.code === "Space" && seatPosition) {
        event.preventDefault();
        handleStandUp();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-ui-control='true']")) {
        return;
      }

      if (event.button === 0 && !isEntering) {
        if (document.pointerLockElement === null) {
          const canvas = document.querySelector('canvas');
          if (canvas) canvas.requestPointerLock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown); 

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown); 
    };
  }, [seatPosition, isEntering, handleStandUp]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        margin: 0,
        padding: 0,
        userSelect: "none", 
        WebkitUserSelect: "none",
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [ENTRY_SPAWN_POINT.x, ENTRY_SPAWN_POINT.y, ENTRY_SPAWN_POINT.z],
          fov: 60,
        }}
        gl={{ toneMappingExposure }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <CameraCoordinatesTracker onChange={setCoordinates} />

        <DayNightScene {...dayNightCycle} isWinterTheme={isWinter} />
        <ProximityInteraction
          enabled={!isEntering && !isSeated}
          targets={interactionTargets}
          onActiveChange={setActiveInteraction}
        />
        <Room
          isDay={dayNightCycle.isDay}
          ambientIntensity={dayNightCycle.ambientIntensity}
          isWinter={isWinter}
          isSummer={isSummer}
          monitorUrl={monitorUrl}
          lampSpotEnabled={lampSpotEnabled}
          onInteractionHintPointsChange={handleInteractionHintPointsChange}
          onLampClick={handleLampClick}
          onMonitorClick={(point, normal) => {
            handleMonitorInteract(point, normal);
          }}
          onSeatClick={() => {
            handleSeatInteract();
          }}
        />

        {isWinter && (
          <Snow
            area={ENTRY_SNOW_SETTINGS.area}
            particleCount={ENTRY_SNOW_SETTINGS.particleCount}
            fallSpeed={ENTRY_SNOW_SETTINGS.fallSpeed}
            size={ENTRY_SNOW_SETTINGS.size}
          />
        )}

        <PortalEnter
          active={isEntering && !!portalTarget}
          target={portalTarget}
          onFinish={handlePortalFinish}
        />

        {seatPosition && <SeatedCameraLock position={seatPosition} />}

        {/* WASD movement */}
        {!isEntering && !isSeated && (
          <Player
            constrainPosition={applyEntryRoomBoundaries}
            standingHeight={ENTRY_ROOM_BOUNDARIES.standingHeight}
          />
        )}

        {/* mouse look */}
        {!isEntering && (
          <SmoothPointerLockControls
            pointerSpeed={0.06}
            smoothing={12}
            maxMovementPerEvent={36}
            lockSettlingMs={120}
          />
        )}
      </Canvas>

      <EntryInstructionHUD
        controlsVisible={instructionPanelVisible}
        quickStartVisible={quickStartVisible}
        activeHint={entryContextHint}
        statusToast={playerStatus}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: "2px solid #34d399",
          background: "rgba(52,211,153,0.2)",
          zIndex: 10,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {shouldWarmHome && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            userSelect: "none",
            overflow: "hidden",
            zIndex: -1,
          }}
        >
          <Home />
        </div>
      )}
    </div>
  );
}
