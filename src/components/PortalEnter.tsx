import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils, PerspectiveCamera } from "three";

type Props = {
  active: boolean;
  target: Vector3 | null;
  onFinish: () => void;
};

const DURATION = 2.8;

const p0 = new Vector3();
const p1 = new Vector3();
const p2 = new Vector3();
const p3 = new Vector3();
const temp = new Vector3();
const dir = new Vector3();
const up = new Vector3(0, 1, 0);

const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const cubicBezier = (
  out: Vector3,
  a: Vector3,
  b: Vector3,
  c: Vector3,
  d: Vector3,
  t: number
) => {
  const it = 1 - t;
  return out.set(
    it * it * it * a.x +
      3 * it * it * t * b.x +
      3 * it * t * t * c.x +
      t * t * t * d.x,
    it * it * it * a.y +
      3 * it * it * t * b.y +
      3 * it * t * t * c.y +
      t * t * t * d.y,
    it * it * it * a.z +
      3 * it * it * t * b.z +
      3 * it * t * t * c.z +
      t * t * t * d.z
  );
};

export default function PortalEnter({ active, target, onFinish }: Props) {
  const { camera } = useThree();
  const cam = camera as PerspectiveCamera;

  const progress = useRef(0);
  const start = useRef(new Vector3());
  const initialFov = useRef(cam.fov);
  const done = useRef(false);

  useEffect(() => {
    if (active && target) {
      progress.current = 0;
      done.current = false;
      start.current.copy(camera.position);
      initialFov.current = cam.fov;
    }
  }, [active, target]);

  useFrame((_, delta) => {
    if (!active || !target || done.current) return;

    progress.current += delta / DURATION;
    const t = Math.min(progress.current, 1);
    const e = ease(t);

    // setup curve
    p0.copy(start.current);
    p3.copy(target).addScaledVector(dir.subVectors(target, start.current).normalize(), -2);

    p1.copy(p0).addScaledVector(up, 0.5);
    p2.copy(p3).addScaledVector(up, 0.3);

    // move camera along curve
    cubicBezier(temp, p0, p1, p2, p3, e);
    camera.position.copy(temp);

    // subtle shake near end
    const shake = 0.02 * (1 - t);
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;

    // always look at portal
    camera.lookAt(target);

    // FOV warp (expand → compress)
    if (e < 0.5) {
      cam.fov = MathUtils.lerp(initialFov.current, initialFov.current * 1.3, e * 2);
    } else {
      cam.fov = MathUtils.lerp(initialFov.current * 1.3, initialFov.current * 0.5, (e - 0.5) * 2);
    }
    cam.updateProjectionMatrix();

    if (t === 1) {
      done.current = true;
      onFinish();
    }
  });

  useEffect(() => {
    return () => {
      cam.fov = initialFov.current;
      cam.updateProjectionMatrix();
    };
  }, []);

  return null;
}