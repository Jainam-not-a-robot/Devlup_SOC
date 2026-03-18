import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { Vector3 } from "three";

import Room from "../components/room";
import Player from "../components/Player";
import Snow from "../components/snow";
import PortalEnter from "../components/PortalEnter";

export default function Entry3D() {
  const navigate = useNavigate();
  const [isEntering, setIsEntering] = useState(false);
  const [target, setTarget] = useState<Vector3 | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black", position: "relative" }}>
      <Canvas camera={{ position: [0, 1.6, 3], fov: 60 }}>
        {/* lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <Room
          onMonitorClick={(point) => {
            if (isEntering) return;
            setTarget(point);
            setIsEntering(true);
          }}
        />

        {/* snow outside */}
        <Snow />

        <Suspense fallback={null}>
          <PortalEnter
            active={isEntering && !!target}
            target={target}
            onFinish={() => navigate("/home")}
          />
        </Suspense>

        {/* WASD movement */}
        {!isEntering && <Player />}

        {/* mouse look */}
        {!isEntering && <PointerLockControls pointerSpeed={0.2} />}
      </Canvas>


      {/* New user instructions panel */}
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
        <div>4) Aim center dot at monitor and click monitor to enter.</div>
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
        Click to lock • WASD to move • Aim at monitor & click
      </div>
    </div>
  );
}