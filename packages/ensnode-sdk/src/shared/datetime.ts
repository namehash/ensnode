import { deserializeDuration } from "./deserialize";
import type { Duration, UnixTimestamp } from "./types";

/**
 * Duration between two moments in time.
 */
export function durationBetween(start: UnixTimestamp, end: UnixTimestamp): Duration {
  return deserializeDuration(end - start, "Duration");
}
