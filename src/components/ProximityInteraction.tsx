import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

export type InteractionTarget = {
  id: string;
  label: string;
  prompt: string;
  position: [number, number, number];
  range: number;
  onInteract: () => void;
};

type ProximityInteractionProps = {
  enabled?: boolean;
  targets: InteractionTarget[];
  onActiveChange: (target: InteractionTarget | null) => void;
};

export default function ProximityInteraction({
  enabled = true,
  targets,
  onActiveChange,
}: ProximityInteractionProps) {
  const { camera } = useThree();
  const activeTargetRef = useRef<InteractionTarget | null>(null);
  const cameraXZ = useMemo(() => new Vector3(), []);
  const targetXZ = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!enabled) {
      if (activeTargetRef.current) {
        activeTargetRef.current = null;
        onActiveChange(null);
      }
      return;
    }

    cameraXZ.set(camera.position.x, 0, camera.position.z);

    let nextTarget: InteractionTarget | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const target of targets) {
      targetXZ.set(target.position[0], 0, target.position[2]);
      const distance = cameraXZ.distanceTo(targetXZ);

      if (distance <= target.range && distance < closestDistance) {
        nextTarget = target;
        closestDistance = distance;
      }
    }

    if (activeTargetRef.current?.id !== nextTarget?.id) {
      activeTargetRef.current = nextTarget;
      onActiveChange(nextTarget);
    }
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled || event.code !== "Enter") return;
      if (!activeTargetRef.current) return;

      event.preventDefault();
      activeTargetRef.current.onInteract();
    };

    // On mobile, a tap near a chair (while proximity is active) should trigger sit
    const handleMobileTap = () => {
      if (!enabled) return;
      if (!activeTargetRef.current) return;
      activeTargetRef.current.onInteract();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mobile-tap", handleMobileTap);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mobile-tap", handleMobileTap);
    };
  }, [enabled]);

  return null;
}
