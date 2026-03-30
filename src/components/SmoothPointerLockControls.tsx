import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Euler, MathUtils } from "three";

type SmoothPointerLockControlsProps = {
  pointerSpeed?: number;
  smoothing?: number;
  maxMovementPerEvent?: number;
  lockSettlingMs?: number;
};

const CAMERA_EULER = new Euler(0, 0, 0, "YXZ");
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.05;

export default function SmoothPointerLockControls({
  pointerSpeed = 0.08,
  smoothing = 18,
  maxMovementPerEvent = 45,
  lockSettlingMs = 100,
}: SmoothPointerLockControlsProps) {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);
  const isLockedRef = useRef(false);
  const lockTimestampRef = useRef(0);

  useEffect(() => {
    const syncFromCamera = () => {
      const rotation = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
      yawRef.current = rotation.y;
      pitchRef.current = rotation.x;
      targetYawRef.current = rotation.y;
      targetPitchRef.current = rotation.x;
    };

    const handleCanvasClick = () => {
      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === gl.domElement;
      if (isLockedRef.current) {
        lockTimestampRef.current = performance.now();
        syncFromCamera();
      } else {
        syncFromCamera();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isLockedRef.current) return;
      if (performance.now() - lockTimestampRef.current < lockSettlingMs) return;

      const movementX = MathUtils.clamp(event.movementX, -maxMovementPerEvent, maxMovementPerEvent);
      const movementY = MathUtils.clamp(event.movementY, -maxMovementPerEvent, maxMovementPerEvent);

      targetYawRef.current -= movementX * pointerSpeed * 0.01;
      targetPitchRef.current = MathUtils.clamp(
        targetPitchRef.current - movementY * pointerSpeed * 0.01,
        -MAX_POLAR_ANGLE,
        MAX_POLAR_ANGLE,
      );
    };

    syncFromCamera();
    gl.domElement.addEventListener("click", handleCanvasClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      gl.domElement.removeEventListener("click", handleCanvasClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [camera, gl, lockSettlingMs, maxMovementPerEvent, pointerSpeed]);

  useFrame((_, delta) => {
    yawRef.current = MathUtils.damp(yawRef.current, targetYawRef.current, smoothing, delta);
    pitchRef.current = MathUtils.damp(pitchRef.current, targetPitchRef.current, smoothing, delta);

    CAMERA_EULER.set(pitchRef.current, yawRef.current, 0);
    camera.quaternion.setFromEuler(CAMERA_EULER);
  });

  return null;
}
