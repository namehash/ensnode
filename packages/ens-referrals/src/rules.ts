import { type USDQuantity, validateUSDQuantity } from "./currency";
import { validateNonNegativeInteger } from "./number";
import { type UnixTimestamp, validateUnixTimestamp } from "./time";

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

/**
 * The maximum number of qualified referrers for ENS Holiday Awards.
 */
export const ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS = 10;

/**
 * The total value of the award pool in USD.
 */
export const ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE: USDQuantity = 10_000.0;

export interface ReferralProgramRules {
  /**
   * The total value of the award pool in USD.
   *
   * NOTE: Awards will actually be distributed in $ENS tokens.
   */
  totalAwardPoolValue: USDQuantity;

  /**
   * The maximum number of referrers that will qualify to receive a non-zero `awardPoolShare`.
   *
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  maxQualifiedReferrers: number;

  /**
   * The start time of the referral program.
   */
  startTime: UnixTimestamp;

  /**
   * The end time of the referral program.
   * @invariant Guaranteed to be greater than or equal to `startTime`
   */
  endTime: UnixTimestamp;
}

export const validateReferralProgramRules = (rules: ReferralProgramRules): void => {
  validateUSDQuantity(rules.totalAwardPoolValue);
  validateNonNegativeInteger(rules.maxQualifiedReferrers);
  validateUnixTimestamp(rules.startTime);
  validateUnixTimestamp(rules.endTime);

  if (rules.endTime < rules.startTime) {
    throw new Error(
      `ReferralProgramRules: startTime: ${rules.startTime} is after endTime: ${rules.endTime}.`,
    );
  }
};

export const buildReferralProgramRules = (
  totalAwardPoolValue: USDQuantity,
  maxQualifiedReferrers: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
): ReferralProgramRules => {
  const result = {
    totalAwardPoolValue,
    maxQualifiedReferrers,
    startTime,
    endTime,
  } satisfies ReferralProgramRules;

  validateReferralProgramRules(result);

  return result;
};
