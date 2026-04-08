import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Environment } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import {
  AdditiveBlending,
  BackSide,
  Color,
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
import ProximityInteraction, {
  type InteractionTarget,
} from "../components/ProximityInteraction";
import { LiquidGlassCard } from "../components/ui/liquid-glass-card";
import {
  LAST_CONTENT_ROUTE_KEY,
  MONITOR_EMBED_QUERY_KEY,
  MONITOR_EMBED_QUERY_VALUE,
} from "../constants/navigation";
import { useDayNightCycle } from "../hooks/useDayNightCycle";
import { isSummer, isWinter } from "../config/sceneTheme";

const ENTRY_ROOM_BOUNDARIES = {
  x: { min: -5.2, max: 6.25 },
  z: { min: -10.10, max: 1.25 },
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
const WINDOW_LIGHT_POSITION: [number, number, number] = [-7.4, 4.9, 4.8];
const WINDOW_LIGHT_TARGET: [number, number, number] = [0.4, 1.6, -2.4];
const SUMMER_SUN_LIGHT_POSITION: [number, number, number] = [-3.2, 7.2, 8.8];
const SUMMER_SUN_LIGHT_TARGET: [number, number, number] = [1.8, 0.6, -3.6];
const ENTRY_PANEL_RADIUS = "16px";
const ENTRY_PANEL_FONT = '"Verdana", "Geneva", sans-serif';
const ENTRY_GUIDE_HEADING_FONT = '"Arial Black", "Arial Bold", Arial, sans-serif';
const WINTER_FOG_COLOR = "#9eb4c7";
const WINTER_WINDOW_BEAM_COLOR = "#ffe2b8";

type Coordinates = {
  x: number;
  y: number;
  z: number;
};

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
        backgroundIntensity={isDay ? (isWinterTheme ? 0.85 : 1.28) : 0.22}
        environmentIntensity={isDay ? (isWinterTheme ? 0.95 : 1.58) : (isWinterTheme ? 0.12 : 0.18)}
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
      {isWinterTheme && (
        <>
          <AtmosphericFogVolume />
          <VolumetricLightBeam
            start={WINDOW_LIGHT_POSITION}
            target={WINDOW_LIGHT_TARGET}
            color={WINTER_WINDOW_BEAM_COLOR}
            radius={3.8}
            opacity={isDay ? 0.1 : 0.16}
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
  const beamRef = useRef<Object3D>(null);
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
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
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
  const entryGuideSteps = useMemo(() => {
    const steps = [
      "Click to lock your cursor into the scene.",
      "Move with WASD and hold Shift to sprint.",
      "Click the monitor to enter the portal.",
      "Click the lamp to switch it on or off.",
    ];

    if (isSeated) {
      steps.push("Press Space to stand up.");
    } else {
      steps.push("Press Enter to sit when you are near the chair.");
    }

    steps.push("Press Esc to unlock the cursor.");

    return steps;
  }, [isSeated]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(intervalId);
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
          onLampClick={() => {
            setLampSpotEnabled((enabled) => !enabled);
          }}
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

      <LiquidGlassCard
        draggable={false}
        blurIntensity="lg"
        glowIntensity="xs"
        shadowIntensity="sm"
        borderRadius={ENTRY_PANEL_RADIUS}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          width: 280,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(191, 219, 254, 0.8)",
            background: "rgba(191, 219, 254, 0.16)",
            color: "#eff6ff",
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.35,
            fontFamily: ENTRY_PANEL_FONT,
            letterSpacing: "0.01em",
          }}
        >
          <div
            style={{
              fontFamily: ENTRY_GUIDE_HEADING_FONT,
              fontWeight: 800,
              marginBottom: 4,
              color: "#dbeafe",
              letterSpacing: "0.03em",
            }}
          >
            Entry Guide
          </div>
          {entryGuideSteps.map((step, index) => (
            <div key={step}>
              {index + 1}) {step}
            </div>
          ))}
        </div>
      </LiquidGlassCard>

      <LiquidGlassCard
        draggable={false}
        blurIntensity="lg"
        glowIntensity="xs"
        shadowIntensity="sm"
        borderRadius={ENTRY_PANEL_RADIUS}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          minWidth: 190,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(191, 219, 254, 0.82)",
            background: "rgba(147, 197, 253, 0.18)",
            color: "#eff6ff",
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.45,
            fontFamily: ENTRY_PANEL_FONT,
            letterSpacing: "0.02em",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, color: "#dbeafe" }}>Live Coordinates</div>
          <div style={{ marginBottom: 6, color: "#bae6fd" }}>Time: {currentTime}</div>
          <div>X: {coordinates.x.toFixed(2)}</div>
          <div>Y: {coordinates.y.toFixed(2)}</div>
          <div>Z: {coordinates.z.toFixed(2)}</div>
          <div style={{ marginTop: 6, color: "#cbd5e1" }}>
            X[{ENTRY_ROOM_BOUNDARIES.x.min}, {ENTRY_ROOM_BOUNDARIES.x.max}] Z[
            {ENTRY_ROOM_BOUNDARIES.z.min}, {ENTRY_ROOM_BOUNDARIES.z.max}]
          </div>
          <div style={{ marginTop: 6, color: "#bfdbfe" }}>
            Spawn [{ENTRY_SPAWN_POINT.x}, {ENTRY_SPAWN_POINT.y}, {ENTRY_SPAWN_POINT.z}]
          </div>
          <div style={{ marginTop: 6, color: isSeated ? "#fef08a" : "#cbd5e1" }}>
            Seat [{ENTRY_SEAT_SETTINGS.position.x}, {ENTRY_SEAT_SETTINGS.position.y},{" "}
            {ENTRY_SEAT_SETTINGS.position.z}] | {isSeated ? "SEATED" : "standing"}
          </div>
        </div>
      </LiquidGlassCard>

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

      <LiquidGlassCard
        draggable={false}
        blurIntensity="md"
        glowIntensity="xs"
        shadowIntensity="sm"
        borderRadius={ENTRY_PANEL_RADIUS}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(191, 219, 254, 0.82)",
            borderRadius: 999,
            background: "rgba(147, 197, 253, 0.18)",
            color: "#eff6ff",
            padding: "4px 8px",
            fontSize: 12,
            fontFamily: ENTRY_PANEL_FONT,
            letterSpacing: "0.02em",
          }}
        >
          WASD to move | Click to lock | Click monitor to enter | Click lamp to toggle
        </div>
      </LiquidGlassCard>

      {activeInteraction && !isEntering && !isSeated && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 52,
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "rgba(3, 7, 18, 0.82)",
            border: "1px solid rgba(96, 165, 250, 0.9)",
            borderRadius: 12,
            color: "#dbeafe",
            padding: "10px 14px",
            minWidth: 220,
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(2, 6, 23, 0.45)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 4 }}>
            {activeInteraction.label} nearby
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{activeInteraction.prompt}</div>
        </div>
      )}

      {isSeated && !isEntering && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 52,
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(250, 204, 21, 0.9)",
            borderRadius: 12,
            color: "#f8fafc",
            padding: "10px 14px",
            minWidth: 260,
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(2, 6, 23, 0.45)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 12, color: "#fde68a", marginBottom: 4 }}>Seated</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Press Space to stand up</div>
        </div>
      )}

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
