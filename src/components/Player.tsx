import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3, MathUtils } from "three";

type PlayerProps = {
  constrainPosition?: (position: Vector3) => void;
  standingHeight?: number;
};

export default function Player({
  constrainPosition,
  standingHeight = 1.6,
}: PlayerProps) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocityRef = useRef(new Vector3(0, 0, 0));
  const targetVelocityRef = useRef(new Vector3(0, 0, 0));
  const forwardRef = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const inputRef = useRef(new Vector3());
  const moveRef = useRef(new Vector3());
  const bobRef = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const forwardInput = (keys.current["KeyW"] ? 1 : 0) - (keys.current["KeyS"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] ? 1 : 0) - (keys.current["KeyA"] ? 1 : 0);

    camera.getWorldDirection(forwardRef.current);
    forwardRef.current.y = 0;
    forwardRef.current.normalize();

    rightRef.current.crossVectors(forwardRef.current, new Vector3(0, 1, 0)).normalize();

    inputRef.current.set(0, 0, 0);
    inputRef.current.addScaledVector(forwardRef.current, forwardInput);
    inputRef.current.addScaledVector(rightRef.current, sideInput);
    if (inputRef.current.lengthSq() > 0) inputRef.current.normalize();

    const isRunning = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const targetSpeed = isRunning ? 4.2 : 2.4;

    targetVelocityRef.current.copy(inputRef.current).multiplyScalar(targetSpeed);
    velocityRef.current.lerp(targetVelocityRef.current, Math.min(1, delta * 10));

    moveRef.current.copy(velocityRef.current).multiplyScalar(delta);
    camera.position.add(moveRef.current);

    const targetY = velocityRef.current.lengthSq() > 0.0001 ? 1.6 + Math.sin(bobRef.current) * 0.028 : 1.6;
    if (velocityRef.current.lengthSq() > 0.0001) {
      bobRef.current += delta * (isRunning ? 10 : 6.5);
      camera.position.y = standingHeight + Math.sin(bobRef.current) * 0.028;
    } else {
      bobRef.current = 0;
      camera.position.y = standingHeight;
    }

    constrainPosition?.(camera.position);
  });

  return null;
}
