import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Points } from "three";

type AxisRange = {
  min: number;
  max: number;
};

type SnowProps = {
  area?: {
    x: AxisRange;
    y: AxisRange;
    z: AxisRange;
  };
  particleCount?: number;
  fallSpeed?: number;
  size?: number;
};

function randomInRange(range: AxisRange) {
  return range.min + Math.random() * (range.max - range.min);
}

export default function Snow({
  area = {
    x: { min: -10, max: 10 },
    y: { min: -5, max: 5 },
    z: { min: -10, max: 10 },
  },
  particleCount = 300,
  fallSpeed = 0.02,
  size = 0.1,
}: SnowProps) {
  const ref = useRef<Points>(null);

  const particles = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = randomInRange(area.x);
      arr[i * 3 + 1] = randomInRange(area.y);
      arr[i * 3 + 2] = randomInRange(area.z);
    }

    return arr;
  }, [
    area.x.min,
    area.x.max,
    area.y.min,
    area.y.max,
    area.z.min,
    area.z.max,
    particleCount,
  ]);

  useFrame(() => {
    if (!ref.current) return;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= fallSpeed;

      if (pos[i + 1] < area.y.min) {
        pos[i] = randomInRange(area.x);
        pos[i + 1] = area.y.max;
        pos[i + 2] = randomInRange(area.z);
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial color="white" size={size} />
    </points>
  );
}
