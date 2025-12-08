import { isInteger, isNonNegativeInteger } from "./number";

/**
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT). May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 *
 * @invariant Guaranteed to be an integer.
 */
export type UnixTimestamp = number;

export const validateUnixTimestamp = (timestamp: UnixTimestamp): void => {
  if (!isInteger(timestamp)) {
    throw new Error(`Invalid Unix timestamp: ${timestamp}. Unix timestamp must be an integer.`);
  }
};

/**
 * Duration
 *
 * Represents a duration in seconds.
 *
 * Guaranteed to be a non-negative integer.
 */
export type Duration = number;

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
