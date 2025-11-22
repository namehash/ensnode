/**
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT).
 *
 * Guaranteed to be an integer. May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 */
export type UnixTimestamp = number;

/**
 * Start date for the ENS Holiday Awards referral program.
 * 2025-12-01T00:00:00Z (December 1, 2025 at 00:00:00 UTC)
 */
export const ENS_HOLIDAY_AWARDS_START_DATE: UnixTimestamp = 1764547200;

/**
 * End date for the ENS Holiday Awards referral program.
 * 2025-12-31T23:59:59Z (December 31, 2025 at 23:59:59 UTC)
 */
export const ENS_HOLIDAY_AWARDS_END_DATE: UnixTimestamp = 1767225599;
