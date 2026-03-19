import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

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
  const bobRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const forwardInput = (keys.current["KeyW"] ? 1 : 0) - (keys.current["KeyS"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] ? 1 : 0) - (keys.current["KeyA"] ? 1 : 0);

    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const input = new Vector3();
    input.addScaledVector(forward, forwardInput);
    input.addScaledVector(right, sideInput);
    if (input.lengthSq() > 0) input.normalize();

    const isRunning = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const targetSpeed = isRunning ? 4.2 : 2.4;

    targetVelocityRef.current.copy(input).multiplyScalar(targetSpeed);
    velocityRef.current.lerp(targetVelocityRef.current, Math.min(1, delta * 8));

    const move = velocityRef.current.clone().multiplyScalar(delta);
    camera.position.add(move);

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
