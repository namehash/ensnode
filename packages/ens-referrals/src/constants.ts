import { getUnixTime } from "date-fns";

/**
 * Start date for the ENS Holiday Awards referral program.
 * December 1, 2025 at 00:00:00 UTC
 */
export const ENS_HOLIDAY_AWARDS_START_DATE = getUnixTime(new Date("2025-12-01T00:00:00.000Z"));

/**
 * End date for the ENS Holiday Awards referral program.
 * December 31, 2025 at 23:59:59 UTC
 */
export const ENS_HOLIDAY_AWARDS_END_DATE = getUnixTime(new Date("2025-12-31T23:59:59.999Z"));
