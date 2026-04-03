import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

type PortalEnterProps = {
  active: boolean;
  cameraTarget: Vector3 | null;
  lookTarget: Vector3 | null;
  onFinish: () => void;
};

const PORTAL_TRANSITION_SPEED = 0.42;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function PortalEnter({
  active,
  cameraTarget,
  lookTarget,
  onFinish,
}: PortalEnterProps) {
  const { camera } = useThree();
  const progress = useRef(0);
  const start = useRef(camera.position.clone());
  const done = useRef(false);

  useEffect(() => {
    if (active && cameraTarget && lookTarget) {
      progress.current = 0;
      start.current = camera.position.clone();
      done.current = false;
    }
  }, [active, camera.position, cameraTarget, lookTarget]);

  useFrame((_, delta) => {
    if (!active || !cameraTarget || !lookTarget || done.current) return;

    progress.current += delta * PORTAL_TRANSITION_SPEED;
    const t = Math.min(progress.current, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(start.current, cameraTarget, eased);
    camera.lookAt(lookTarget);

    if (t >= 1) {
      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);
      done.current = true;
      onFinish();
    }
  });

  return null;
}
