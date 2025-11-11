import { getUnixTime } from "date-fns";

/**
 * Start date for the ENS Holiday Awards referral program.
 * January 1, 2025 at 00:00:00 UTC
 */
export const ENSAWARDS_START_DATE = getUnixTime(new Date("2025-01-01T00:00:00.000Z"));

/**
 * End date for the ENS Holiday Awards referral program.
 * January 1, 2026 at 00:00:00 UTC
 */
export const ENSAWARDS_END_DATE = getUnixTime(new Date("2026-01-01T00:00:00.000Z"));
