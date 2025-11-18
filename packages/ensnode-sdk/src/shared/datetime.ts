import { deserializeDuration, deserializeUnixTimestamp } from "./deserialize";
import type { Duration, UnixTimestamp } from "./types";

/**
 * Duration between two moments in time.
 */
export function durationBetween(start: UnixTimestamp, end: UnixTimestamp): Duration {
  return deserializeDuration(end - start, "Duration");
}

/**
 * Add a duration to a timestamp.
 */
export function addDuration(timestamp: UnixTimestamp, duration: Duration): UnixTimestamp {
  return deserializeUnixTimestamp(timestamp + duration, "UnixTimestamp");
}
