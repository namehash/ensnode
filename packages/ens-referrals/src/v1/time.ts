import type { Duration, UnixTimestamp } from "@ensnode/ensnode-sdk";

import { isInteger, isNonNegativeInteger } from "./number";

export const validateUnixTimestamp = (timestamp: UnixTimestamp): void => {
  if (!isInteger(timestamp)) {
    throw new Error(`Invalid Unix timestamp: ${timestamp}. Unix timestamp must be an integer.`);
  }
};

/**
 * The number of seconds in a year.
 *
 * (60 seconds per minute * 60 minutes per hour *
 *  24 hours per day * 365.2425 days on average per year).
 */
export const SECONDS_PER_YEAR: Duration = 31556952;

export function isValidDuration(duration: Duration): boolean {
  return isNonNegativeInteger(duration);
}

export function validateDuration(duration: Duration): void {
  if (!isValidDuration(duration)) {
    throw new Error(`Invalid duration: ${duration}. Duration must be a non-negative integer.`);
  }
}
