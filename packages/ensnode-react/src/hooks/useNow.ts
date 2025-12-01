import { getUnixTime } from "date-fns";
import { useEffect, useState } from "react";

/**
 * Hook that returns the current Unix timestamp, updated at a specified interval.
 *
 * @param refreshRate - How often to update the timestamp in milliseconds (default: 1000ms)
 * @returns Current Unix timestamp that updates every refreshRate milliseconds
 *
 * @example
 * ```tsx
 * // Updates every second
 * const now = useNow(1000);
 *
 * // Updates every 5 seconds
 * const now = useNow(5000);
 * ```
 */
export function useNow(refreshRate = 1000): number {
  const [now, setNow] = useState(() => getUnixTime(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getUnixTime(new Date()));
    }, refreshRate);

    return () => clearInterval(interval);
  }, [refreshRate]);

  return now;
}
