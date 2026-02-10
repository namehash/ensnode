import { getUnixTime } from "date-fns/getUnixTime";

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

/**
 * Parses an ISO 8601 date string into a {@link UnixTimestamp}.
 *
 * Accepts date strings in ISO 8601 format with an explicit timezone designator
 * (trailing 'Z' or offset like +HH:MM/-HH:MM), e.g., "2025-12-01T00:00:00Z".
 *
 * @param isoDateString - The ISO 8601 date string to parse (must include timezone)
 * @returns The Unix timestamp (seconds since epoch)
 *
 * @throws {Error} If the date string is missing a timezone designator or cannot be parsed
 *
 * @example
 * parseTimestamp("2025-12-01T00:00:00Z") // returns 1764547200
 * parseTimestamp("2026-03-31T23:59:59Z") // returns 1775001599
 */
export function parseTimestamp(isoDateString: string): UnixTimestamp {
  if (!/Z$|[+-]\d{2}:\d{2}$/.test(isoDateString)) {
    throw new Error(`Timezone required: provide Z or offset`);
  }

  const date = new Date(isoDateString);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoDateString}`);
  }

  return deserializeUnixTimestamp(getUnixTime(date), "UnixTimestamp");
}
