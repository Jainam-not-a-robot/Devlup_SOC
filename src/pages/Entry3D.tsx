import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Environment, PointerLockControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { Vector3 } from "three";

import Room from "../components/Room";
import Player from "../components/Player";
import Snow from "../components/Snow";
import PortalEnter from "../components/PortalEnter";
import {
  LAST_CONTENT_ROUTE_KEY,
  MONITOR_EMBED_QUERY_KEY,
  MONITOR_EMBED_QUERY_VALUE,
} from "../constants/navigation";

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
    if (elapsedRef.current < 1 / 12) return;
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
  const [isEntering, setIsEntering] = useState(false);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [seatPosition, setSeatPosition] = useState<Vector3 | null>(null);
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
  const isSeated = !!seatPosition;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && seatPosition) {
        setSeatPosition(null);
      }
    };

    const handlePointerLockChange = () => {
      if (seatPosition && document.pointerLockElement == null) {
        setSeatPosition(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
    };
  }, [seatPosition]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black", position: "relative" }}>
      <Canvas
        camera={{
          position: [ENTRY_SPAWN_POINT.x, ENTRY_SPAWN_POINT.y, ENTRY_SPAWN_POINT.z],
          fov: 60,
        }}
      >
        <CameraCoordinatesTracker onChange={setCoordinates} />

        <Environment files="/winter_lake_01_4k.exr" background />
        <Room
          monitorUrl={monitorUrl}
          onMonitorClick={(point) => {
            if (isEntering) return;
            setSeatPosition(null);
            setTarget(point);
            setIsEntering(true);
          }}
          onSeatClick={() => {
            if (isEntering) return;

            setSeatPosition(
              new Vector3(
                ENTRY_SEAT_SETTINGS.position.x,
                ENTRY_SEAT_SETTINGS.position.y,
                ENTRY_SEAT_SETTINGS.position.z,
              ),
            );
          }}
        />

        {/* snow outside */}
        <Snow
          area={ENTRY_SNOW_SETTINGS.area}
          particleCount={ENTRY_SNOW_SETTINGS.particleCount}
          fallSpeed={ENTRY_SNOW_SETTINGS.fallSpeed}
          size={ENTRY_SNOW_SETTINGS.size}
        />

        <Suspense fallback={null}>
          <PortalEnter
            active={isEntering && !!target}
            target={target}
            onFinish={() => navigate(returnRoute)}
          />
        </Suspense>

        {seatPosition && <SeatedCameraLock position={seatPosition} />}

        {/* WASD movement */}
        {!isEntering && !isSeated && (
          <Player
            constrainPosition={applyEntryRoomBoundaries}
            standingHeight={ENTRY_ROOM_BOUNDARIES.standingHeight}
          />
        )}

        {/* mouse look */}
        {!isEntering && <PointerLockControls pointerSpeed={0.2} />}
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
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Entry Guide</div>
        <div>1) Click inside to lock mouse.</div>
        <div>2) Move mouse to look around.</div>
        <div>3) Use WASD to walk (Shift to sprint).</div>
        <div>4) Click Seat.001 to sit. Press Escape to leave the seat.</div>
        <div>5) Aim center dot at monitor and click monitor to enter.</div>
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

      {/* Center aim dot */}
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
        }}
      >
        Click to lock | WASD to move | Aim at monitor & click
      </div>
    </div>
  );
}
