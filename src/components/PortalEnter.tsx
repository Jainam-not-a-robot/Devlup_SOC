import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

type PortalEnterProps = {
  active: boolean;
  target: Vector3 | null;
  onFinish: () => void;
};

export default function PortalEnter({ active, target, onFinish }: PortalEnterProps) {
  const { camera } = useThree();
  const progress = useRef(0);
  const start = useRef(camera.position.clone());
  const done = useRef(false);

  useEffect(() => {
    if (active && target) {
      progress.current = 0;
      start.current = camera.position.clone();
      done.current = false;
    }
  }, [active, target, camera.position]);

  useFrame((_, delta) => {
    if (!active || !target || done.current) return;

    progress.current += delta * 0.7;
    const t = Math.min(progress.current, 1);

    const destination = new Vector3(target.x, target.y, target.z + 0.1);
    camera.position.lerpVectors(start.current, destination, t);
    camera.lookAt(target);

    if (t >= 1) {
      done.current = true;
      onFinish();
    }
  });

  return null;
}
