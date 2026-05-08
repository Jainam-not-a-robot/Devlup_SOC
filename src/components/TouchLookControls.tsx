import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";
import { Euler, MathUtils } from "three";

const CAMERA_EULER = new Euler(0, 0, 0, "YXZ");
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.05;

type TouchLookControlsProps = {
  sensitivity?: number;
  smoothing?: number;
};

/**
 * Camera look controls driven by external touch deltas.
 *
 * Instead of listening for mouse/touch events directly, this component
 * exposes a `feedLookDelta(dx, dy)` method via a shared ref so the
 * parent MobileControls can pipe touch deltas in from the "look zone".
 */
export type TouchLookControlsHandle = {
  feedLookDelta: (dx: number, dy: number) => void;
};

/**
 * A ref-based singleton so the Entry3D page can wire MobileControls → camera
 * without prop-drilling through the R3F tree.
 */
let sharedHandle: TouchLookControlsHandle | null = null;
export function getTouchLookHandle(): TouchLookControlsHandle | null {
  return sharedHandle;
}

export default function TouchLookControls({
  sensitivity = 0.3,
  smoothing = 14,
}: TouchLookControlsProps) {
  const { camera } = useThree();
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);

  // Sync initial camera rotation
  useEffect(() => {
    const rotation = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yawRef.current = rotation.y;
    pitchRef.current = rotation.x;
    targetYawRef.current = rotation.y;
    targetPitchRef.current = rotation.x;
  }, [camera]);

  const feedLookDelta = useCallback(
    (dx: number, dy: number) => {
      targetYawRef.current -= dx * sensitivity * 0.01;
      targetPitchRef.current = MathUtils.clamp(
        targetPitchRef.current - dy * sensitivity * 0.01,
        -MAX_POLAR_ANGLE,
        MAX_POLAR_ANGLE,
      );
    },
    [sensitivity],
  );

  // Register shared handle
  useEffect(() => {
    sharedHandle = { feedLookDelta };
    return () => {
      if (sharedHandle?.feedLookDelta === feedLookDelta) {
        sharedHandle = null;
      }
    };
  }, [feedLookDelta]);

  useFrame((_, delta) => {
    yawRef.current = MathUtils.damp(
      yawRef.current,
      targetYawRef.current,
      smoothing,
      delta,
    );
    pitchRef.current = MathUtils.damp(
      pitchRef.current,
      targetPitchRef.current,
      smoothing,
      delta,
    );

    CAMERA_EULER.set(pitchRef.current, yawRef.current, 0);
    camera.quaternion.setFromEuler(CAMERA_EULER);
  });

  return null;
}
