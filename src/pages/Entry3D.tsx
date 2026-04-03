import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Environment } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { Vector3, Quaternion } from "three";

import Home from "./Home";
import Room from "../components/Room";
import Player from "../components/Player";
import Snow from "../components/Snow";
import SmoothPointerLockControls from "../components/SmoothPointerLockControls";
import ProximityInteraction, {
  type InteractionTarget,
} from "../components/ProximityInteraction";
import {
  LAST_CONTENT_ROUTE_KEY,
  MONITOR_EMBED_QUERY_KEY,
  MONITOR_EMBED_QUERY_VALUE,
} from "../constants/navigation";

import useSound from "use-sound";

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

type Coordinates = {
  x: number;
  y: number;
  z: number;
};

// --- CUSTOM TRANSITION COMPONENT ---
function CameraTransition({
  active,
  cameraTarget,
  lookTarget,
  onFinish
}: {
  active: boolean;
  cameraTarget: Vector3;
  lookTarget: Vector3;
  onFinish: () => void;
}) {
  const { camera } = useThree();
  const finished = useRef(false);

  useFrame((_, delta) => {
    if (!active || finished.current) return;

    camera.position.lerp(cameraTarget, 1.5 * delta);

    const currentQuat = camera.quaternion.clone();
    camera.lookAt(lookTarget);
    const targetQuat = camera.quaternion.clone();
    camera.quaternion.copy(currentQuat);
    camera.quaternion.slerp(targetQuat, 4 * delta);

    if (camera.position.distanceTo(cameraTarget) < 0.2) {
      finished.current = true;
      onFinish();
    }
  });

  return null;
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

export default function Entry3D() {
  const navigate = useNavigate();
  
  const [play, { stop }] = useSound("/music.mp3", {
    volume: 0.03,
    loop: true,
  });
  
  const [isEntering, setIsEntering] = useState(false);
  const [portalCameraTarget, setPortalCameraTarget] = useState<Vector3 | null>(null);
  const [portalLookTarget, setPortalLookTarget] = useState<Vector3 | null>(null);
  const [seatPosition, setSeatPosition] = useState<Vector3 | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<InteractionTarget | null>(null);
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
    stop(); 
    navigate(returnRoute);
  }, [navigate, returnRoute, stop]);

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

    const cameraTarget = targetPoint.clone().add(
      outwardNormal.normalize().multiplyScalar(0.4) 
    );
    cameraTarget.y = -1; 

    const lookTarget = targetPoint.clone().sub(
      outwardNormal.clone().multiplyScalar(10)
    );
    lookTarget.y = -1; 

    setPortalLookTarget(lookTarget);
    setPortalCameraTarget(cameraTarget);
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

  useEffect(() => {
    play();
  }, [play]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. Stand up using Space
      if (event.code === "Space" && seatPosition) {
        setSeatPosition(null);
      }

      // 2. Lock/Unlock viewing mode on "L" 
      if ((event.code === "KeyL" || event.key === "l" || event.key === "L") && !isEntering) {
        event.preventDefault(); 
        const canvas = document.querySelector('canvas');
        if (canvas) {
          // Allow the L key to TOGGLE the lock on and off
          if (document.pointerLockElement) {
            document.exitPointerLock();
          } else {
            canvas.requestPointerLock();
          }
        }
      }
    };

    // 3. Lock viewing mode on Click 
    const handleMouseDown = (event: MouseEvent) => {
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
  }, [seatPosition, isEntering]);

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
        camera={{
          position: [ENTRY_SPAWN_POINT.x, ENTRY_SPAWN_POINT.y, ENTRY_SPAWN_POINT.z],
          fov: 60,
        }}
        gl={{ toneMappingExposure: 0.28 }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <CameraCoordinatesTracker onChange={setCoordinates} />

        <Environment
          files="/winter_lake_01_4k.exr"
          background
          backgroundIntensity={0.18}
          environmentIntensity={0.025}
        />
        <ProximityInteraction
          enabled={!isEntering && !isSeated}
          targets={interactionTargets}
          onActiveChange={setActiveInteraction}
        />
        <Room
          monitorUrl={monitorUrl}
          onMonitorClick={(point, normal) => {
            handleMonitorInteract(point, normal);
          }}
          onSeatClick={() => {
            handleSeatInteract();
          }}
        />

        {/* snow outside */}
        <Snow
          area={ENTRY_SNOW_SETTINGS.area}
          particleCount={ENTRY_SNOW_SETTINGS.particleCount}
          fallSpeed={ENTRY_SNOW_SETTINGS.fallSpeed}
          size={ENTRY_SNOW_SETTINGS.size}
        />

        <CameraTransition
          active={isEntering && !!portalCameraTarget && !!portalLookTarget}
          cameraTarget={portalCameraTarget || new Vector3()}
          lookTarget={portalLookTarget || new Vector3()}
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

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          width: 280,
          borderRadius: 10,
          border: "1px solid #34d399",
          background: "rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: 1.35,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Entry Guide</div>
        <div>1) Click the monitor to enter the system.</div>
        <div>2) Use WASD to walk (Shift to sprint).</div>
        <div>3) Press L or Left-Click for viewing mode.</div>
        <div>4) Click Seat or press Enter nearby to sit.</div>
        {/* CHANGED TO REFLECT THE SPACE KEY LOGIC */}
        <div>5) Press Space to stand up. Escape unlocks mouse.</div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          minWidth: 190,
          borderRadius: 10,
          border: "1px solid #93c5fd",
          background: "rgba(0,0,0,0.7)",
          color: "#e2e8f0",
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: 1.45,
          fontFamily: "monospace",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#bfdbfe" }}>Live Coordinates</div>
        <div>X: {coordinates.x.toFixed(2)}</div>
        <div>Y: {coordinates.y.toFixed(2)}</div>
        <div>Z: {coordinates.z.toFixed(2)}</div>
        <div style={{ marginTop: 6, color: "#94a3b8" }}>
          X[{ENTRY_ROOM_BOUNDARIES.x.min}, {ENTRY_ROOM_BOUNDARIES.x.max}] Z[
          {ENTRY_ROOM_BOUNDARIES.z.min}, {ENTRY_ROOM_BOUNDARIES.z.max}]
        </div>
        <div style={{ marginTop: 6, color: "#a7f3d0" }}>
          Spawn [{ENTRY_SPAWN_POINT.x}, {ENTRY_SPAWN_POINT.y}, {ENTRY_SPAWN_POINT.z}]
        </div>
        <div style={{ marginTop: 6, color: isSeated ? "#facc15" : "#94a3b8" }}>
          Seat [{ENTRY_SEAT_SETTINGS.position.x}, {ENTRY_SEAT_SETTINGS.position.y},{" "}
          {ENTRY_SEAT_SETTINGS.position.z}] | {isSeated ? "SEATED" : "standing"}
        </div>
        <div style={{ marginTop: 6, color: "#cbd5e1" }}>
          Snow X[{ENTRY_SNOW_AREA.x.min}, {ENTRY_SNOW_AREA.x.max}] Z[{ENTRY_SNOW_AREA.z.min},{" "}
          {ENTRY_SNOW_AREA.z.max}]
        </div>
        <div style={{ marginTop: 6, color: "#7dd3fc" }}>Monitor Route: {monitorUrl}</div>
      </div>

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

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid #93c5fd",
          borderRadius: 999,
          color: "#e2e8f0",
          padding: "4px 8px",
          fontSize: 12,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        WASD to move | Click monitor to enter | Press L for mouse look
      </div>

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