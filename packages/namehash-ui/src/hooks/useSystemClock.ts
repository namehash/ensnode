import { getUnixTime } from "date-fns";
import { useSyncExternalStore } from "react";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { systemClock } from "../utils/systemClock";

/**
 * Use System Clock
 *
 * Allows reading the current system time {@link UnixTimestamp} which stays
 * exactly the same across all callers of this hook.
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */
export function useSystemClock(): UnixTimestamp {
  const subscribe = (callback: () => void) => {
    systemClock.addListener(callback);

    return () => {
      systemClock.removeListener(callback);
    };
  };
  const getSnapshot = () => getUnixTime(new Date(systemClock.currentTime));
  const getServerSnapshot = () => getUnixTime(new Date());

  const syncedSystemClock = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // syncedSystemClock will be undefined on the initial render,
  // so we return the snapshot result to ensure there's always
  // some UnixTime value returned.
  return syncedSystemClock ?? getSnapshot();
}
