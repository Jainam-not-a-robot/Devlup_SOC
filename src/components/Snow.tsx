import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Points } from "three";

export default function Snow() {
  const ref = useRef<Points>(null);

  const particles = useMemo(() => {
    const arr = new Float32Array(300 * 3);

    for (let i = 0; i < 300; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    const pos = ref.current.geometry.attributes.position.array;

    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= 0.02;

      if (pos[i + 1] < -5) pos[i + 1] = 5;
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

      <pointsMaterial color="white" size={0.1} />
    </points>
  );
}