import {
  type AccountId,
  type PriceUsdc,
  priceUsdc,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "./number";
import { validateUnixTimestamp } from "./time";

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
 * The total value of the award pool in USDC.
 * 10,000 USDC = 10,000,000,000 (10_000 * 10^6 smallest units)
 */
export const ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE: PriceUsdc = priceUsdc(10_000_000_000n);

export interface ReferralProgramRules {
  /**
   * The total value of the award pool in USDC.
   *
   * NOTE: Awards will actually be distributed in $ENS tokens.
   */
  totalAwardPoolValue: PriceUsdc;

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

  /**
   * The account ID of the subregistry for the referral program.
   */
  subregistryId: AccountId;
}

export const validateReferralProgramRules = (rules: ReferralProgramRules): void => {
  // Validate totalAwardPoolValue using Zod schema
  const priceUsdcSchema = makePriceUsdcSchema("ReferralProgramRules.totalAwardPoolValue");
  const parseResult = priceUsdcSchema.safeParse(rules.totalAwardPoolValue);
  if (!parseResult.success) {
    throw new Error(
      `ReferralProgramRules: totalAwardPoolValue validation failed: ${parseResult.error.message}`,
    );
  }

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
  totalAwardPoolValue: PriceUsdc,
  maxQualifiedReferrers: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
  subregistryId: AccountId,
): ReferralProgramRules => {
  const result = {
    totalAwardPoolValue,
    maxQualifiedReferrers,
    startTime,
    endTime,
    subregistryId,
  } satisfies ReferralProgramRules;

  validateReferralProgramRules(result);

  return result;
};
