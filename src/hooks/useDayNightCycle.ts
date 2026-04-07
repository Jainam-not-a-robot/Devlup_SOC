import { useEffect, useMemo, useState } from "react";

type DayNightCycle = {
  isDay: boolean;
  backgroundColor: string;
  sunIntensity: number;
  ambientIntensity: number;
  environmentMap: string;
};

const DAY_ENVIRONMENT_MAP = "/docklands_01_1k.exr";
const NIGHT_ENVIRONMENT_MAP = "/docklands_01_1k.exr";

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
      backgroundColor: isDay ? "#87CEEB" : "#0b0f1a",
      sunIntensity: isDay ? 1.35 : 0.8,
      ambientIntensity: isDay ? 0.6 : 0.2,
      environmentMap: isDay ? DAY_ENVIRONMENT_MAP : NIGHT_ENVIRONMENT_MAP,
    }),
    [isDay],
  );
}
