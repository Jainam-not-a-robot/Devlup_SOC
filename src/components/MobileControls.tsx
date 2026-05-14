import { useCallback, useEffect, useRef, useState } from "react";
import "./MobileControls.css";

export type JoystickInput = {
  x: number; // -1 … 1  (left / right)
  y: number; // -1 … 1  (backward / forward,  +y = forward)
};

type MobileControlsProps = {
  onJoystickChange: (input: JoystickInput) => void;
  onLookChange: (deltaX: number, deltaY: number) => void;
  onTap: (screenX: number, screenY: number) => void;
  onDoubleTap?: () => void;
  visible: boolean;
};

const JOYSTICK_RADIUS = 18;
const JOYSTICK_DEAD_ZONE = 0.12;

export default function MobileControls({
  onJoystickChange,
  onLookChange,
  onTap,
  onDoubleTap,
  visible,
}: MobileControlsProps) {
  /* ── joystick state ── */
  const joystickOriginRef = useRef<{ x: number; y: number } | null>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOriginPos, setJoystickOriginPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  /* ── look-drag state ── */
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastRef = useRef<{ x: number; y: number } | null>(null);

  /* ── tap detection ── */
  const lastTapTimeRef = useRef(0);
  const tapStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  /* ── Emit joystick input whenever delta changes ── */
  const lastEmittedRef = useRef<string>("");
  useEffect(() => {
    const key = `${joystickDelta.x.toFixed(3)}|${joystickDelta.y.toFixed(3)}`;
    if (key === lastEmittedRef.current) return;
    lastEmittedRef.current = key;
    onJoystickChange(joystickDelta);
  }, [joystickDelta, onJoystickChange]);

  /* ── Joystick touch handlers (left half) ── */
  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (joystickTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      joystickTouchIdRef.current = touch.identifier;
      joystickOriginRef.current = { x: touch.clientX, y: touch.clientY };
      setJoystickOriginPos({ x: touch.clientX, y: touch.clientY });
      setJoystickActive(true);
      setJoystickDelta({ x: 0, y: 0 });
    },
    [],
  );

  const handleJoystickTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (joystickTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== joystickTouchIdRef.current) continue;

        const origin = joystickOriginRef.current!;
        let dx = (touch.clientX - origin.x) / JOYSTICK_RADIUS;
        let dy = -(touch.clientY - origin.y) / JOYSTICK_RADIUS; // invert y: up = forward

        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 1) {
          dx /= mag;
          dy /= mag;
        }
        if (mag < JOYSTICK_DEAD_ZONE) {
          dx = 0;
          dy = 0;
        }

        setJoystickDelta({ x: dx, y: dy });

        // Clamp the visual knob position to the circle
        const visualDx = Math.min(1, mag) * (dx / (mag || 1)) * JOYSTICK_RADIUS;
        const visualDy =
          -Math.min(1, mag) * (dy / (mag || 1)) * JOYSTICK_RADIUS;
        // Store for rendering (done via state but we keep it lightweight)
        setJoystickDelta({ x: dx, y: dy });
      }
    },
    [],
  );

  const handleJoystickTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          joystickOriginRef.current = null;
          setJoystickActive(false);
          setJoystickOriginPos(null);
          setJoystickDelta({ x: 0, y: 0 });
          break;
        }
      }
    },
    [],
  );

  /* ── Look-drag handlers (right half) ── */
  const handleLookTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (lookTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      lookTouchIdRef.current = touch.identifier;
      lookLastRef.current = { x: touch.clientX, y: touch.clientY };

      // Record for tap detection
      tapStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };
    },
    [],
  );

  const handleLookTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (lookTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== lookTouchIdRef.current) continue;

        const last = lookLastRef.current!;
        const deltaX = touch.clientX - last.x;
        const deltaY = touch.clientY - last.y;
        lookLastRef.current = { x: touch.clientX, y: touch.clientY };

        onLookChange(deltaX, deltaY);

        // If finger moved too far, cancel tap
        if (tapStartRef.current) {
          const drift =
            Math.abs(touch.clientX - tapStartRef.current.x) +
            Math.abs(touch.clientY - tapStartRef.current.y);
          if (drift > 12) tapStartRef.current = null;
        }
      }
    },
    [onLookChange],
  );

  const handleLookTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== lookTouchIdRef.current) continue;

        lookTouchIdRef.current = null;
        lookLastRef.current = null;

        // Detect tap vs drag
        if (tapStartRef.current) {
          const elapsed = performance.now() - tapStartRef.current.time;
          if (elapsed < 300) {
            // double-tap detection
            const now = performance.now();
            if (now - lastTapTimeRef.current < 350) {
              onDoubleTap?.();
            } else {
              onTap(touch.clientX, touch.clientY);
            }
            lastTapTimeRef.current = now;
          }
          tapStartRef.current = null;
        }
        break;
      }
    },
    [onTap, onDoubleTap],
  );

  /* ── Prevent default to stop page scrolling ── */
  useEffect(() => {
    if (!visible) return;

    const preventScroll = (e: TouchEvent) => {
      // Only prevent default on our control zones
      const target = e.target as HTMLElement | null;
      if (target?.closest(".mobile-controls-zone")) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [visible]);

  if (!visible) return null;

  // Calculate visual knob offset
  const knobX = joystickDelta.x * JOYSTICK_RADIUS;
  const knobY = -joystickDelta.y * JOYSTICK_RADIUS; // re-invert for screen coords

  return (
    <div className="mobile-controls-layer" data-ui-control="true">
      {/* Left half: joystick zone */}
      <div
        className="mobile-controls-zone mobile-joystick-zone"
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        onTouchCancel={handleJoystickTouchEnd}
      >
        {joystickActive && joystickOriginPos && (
          <div
            className="mobile-joystick-base"
            style={{
              left: joystickOriginPos.x,
              top: joystickOriginPos.y,
            }}
          >
            <div className="mobile-joystick-ring" />
            <div
              className="mobile-joystick-knob"
              style={{
                transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`,
              }}
            />
          </div>
        )}

        {/* Static joystick hint when idle */}
        {!joystickActive && (
          <div className="mobile-joystick-hint">
            <div className="mobile-joystick-hint-ring" />
            <span className="mobile-joystick-hint-label">MOVE</span>
          </div>
        )}
      </div>

      {/* Right half: look / tap zone */}
      <div
        className="mobile-controls-zone mobile-look-zone"
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
      >
        <div className="mobile-look-hint">
          <span className="mobile-look-hint-label">LOOK & TAP</span>
        </div>
      </div>
    </div>
  );
}