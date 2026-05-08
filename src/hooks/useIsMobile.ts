import { useEffect, useState } from "react";

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;

  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  // Treat narrow screens with touch as mobile even if UA doesn't match (e.g. tablets)
  const narrowViewport = window.innerWidth <= 1024 && hasTouch;

  return mobileUA || narrowViewport;
}

/**
 * Returns `true` when the current device is a mobile / tablet
 * (touch-primary, narrow viewport, or mobile user-agent).
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(detectMobile);

  useEffect(() => {
    const update = () => setMobile(detectMobile());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mobile;
}

export function isMobileDevice(): boolean {
  return detectMobile();
}
