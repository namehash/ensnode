import { useEffect, useState } from "react";

import { Duration, UnixTimestamp } from "@ensnode/ensnode-sdk";

import { useSystemClock } from "./use-system-clock";

/** Default time to refresh: `1` second. */
export const DEFAULT_TIME_TO_REFRESH: Duration = 1;

export interface UseNowProps {
  /**
   * Duration after which time value will be refreshed.
   *
   * Defaults to {@link DEFAULT_TIME_TO_REFRESH}.
   */
  timeToRefresh?: Duration;
}

/**
 * Use now
 *
 * This hook returns the current system time while following `timeToRefresh` param.
 *
 * @param timeToRefresh Duration after which time value will be refreshed.
 *
 * @example
 * ```ts
 * // `now` will be updated each second (by default)
 * const now = useNow();
 * ```
 * @example
 * ```ts
 * // `now` will be updated each 5 seconds
 * const now = useNow({ timeToRefresh: 5 });
 * ```
 */
export function useNow(props?: UseNowProps): UnixTimestamp {
  const clock = useSystemClock();
  const [throttledClock, setThrottledClock] = useState(clock);
  const { timeToRefresh = DEFAULT_TIME_TO_REFRESH } = props || {};

  useEffect(() => {
    if (clock - throttledClock >= timeToRefresh) {
      setThrottledClock(clock);
    }
  }, [timeToRefresh, clock, throttledClock]);

  return throttledClock;
}
