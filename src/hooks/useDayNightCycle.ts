import { useEffect, useMemo, useState } from "react";
import { isWinter } from "../config/sceneTheme";

type DayNightCycle = {
  isDay: boolean;
  backgroundColor: string;
  sunIntensity: number;
  ambientIntensity: number;
  environmentMap: string;
};

const DAY_ENVIRONMENT_MAP = "/docklands_02_2k.hdr";
const NIGHT_ENVIRONMENT_MAP = "/cobblestone_street_night_2k.hdr";

function getIsDayFromLocalTime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

export function useDayNightCycle(): DayNightCycle {
  const [isDay, setIsDay] = useState(getIsDayFromLocalTime);

  useEffect(() => {
    const updateCycle = () => {
      setIsDay(getIsDayFromLocalTime());
    };

    updateCycle();
    const intervalId = window.setInterval(updateCycle, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({
      isDay,
      backgroundColor: isDay ? (isWinter ? "#c7d7ea" : "#87CEEB") : "#0b0f1a",
      sunIntensity: isDay ? (isWinter ? 0.95 : 1.45) : (isWinter ? 0.42 : 0.72),
      ambientIntensity: isDay ? (isWinter ? 0.38 : 0.66) : (isWinter ? 0.12 : 0.16),
      environmentMap: isDay ? DAY_ENVIRONMENT_MAP : NIGHT_ENVIRONMENT_MAP,
    }),
    [isDay],
  );
}
