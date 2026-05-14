import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";
import { Vector3 } from "three";
import type { JoystickInput } from "./MobileControls";

type MobilePlayerProps = {
  constrainPosition?: (position: Vector3) => void;
  standingHeight?: number;
};

/**
 * Shared joystick input ref – fed by MobileControls from outside the R3F tree.
 */
let sharedJoystickInput: JoystickInput = { x: 0, y: 0 };
export function feedMobileJoystick(input: JoystickInput) {
  sharedJoystickInput = input;
}

/**
 * Player movement driven by virtual joystick input.
 * The forward direction is determined by camera facing (y flattened).
 */
export default function MobilePlayer({
  constrainPosition,
  standingHeight = 1.6,
}: MobilePlayerProps) {
  const { camera } = useThree();
  const velocityRef = useRef(new Vector3(0, 0, 0));
  const targetVelocityRef = useRef(new Vector3(0, 0, 0));
  const forwardRef = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const inputRef = useRef(new Vector3());
  const moveRef = useRef(new Vector3());
  const bobRef = useRef(0);

  useFrame((_, delta) => {
    const { x: sideInput, y: forwardInput } = sharedJoystickInput;

    camera.getWorldDirection(forwardRef.current);
    forwardRef.current.y = 0;
    forwardRef.current.normalize();

    rightRef.current
      .crossVectors(forwardRef.current, new Vector3(0, 1, 0))
      .normalize();

    inputRef.current.set(0, 0, 0);
    inputRef.current.addScaledVector(forwardRef.current, forwardInput);
    inputRef.current.addScaledVector(rightRef.current, sideInput);
    if (inputRef.current.lengthSq() > 0) inputRef.current.normalize();

    const targetSpeed = 2.4;
    targetVelocityRef.current.copy(inputRef.current).multiplyScalar(targetSpeed);
    velocityRef.current.lerp(targetVelocityRef.current, Math.min(1, delta * 10));

    moveRef.current.copy(velocityRef.current).multiplyScalar(delta);
    camera.position.add(moveRef.current);

    if (velocityRef.current.lengthSq() > 0.0001) {
      bobRef.current += delta * 6.5;
      camera.position.y = standingHeight + Math.sin(bobRef.current) * 0.028;
    } else {
      bobRef.current = 0;
      camera.position.y = standingHeight;
    }

    constrainPosition?.(camera.position);
  });

  return null;
}