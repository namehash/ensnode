import type { AccountId, PriceUsdc, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { makeAccountIdSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "./number";
import { validateUnixTimestamp } from "./time";

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

  /**
   * URL to the full rules document for these rules.
   * @example new URL("https://ensawards.org/ens-holiday-awards-rules")
   */
  rulesUrl: URL;
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

  // Validate subregistryId using Zod schema
  const accountIdSchema = makeAccountIdSchema("ReferralProgramRules.subregistryId");
  const accountIdParseResult = accountIdSchema.safeParse(rules.subregistryId);
  if (!accountIdParseResult.success) {
    throw new Error(
      `ReferralProgramRules: subregistryId validation failed: ${accountIdParseResult.error.message}`,
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
  rulesUrl: URL,
): ReferralProgramRules => {
  const result = {
    totalAwardPoolValue,
    maxQualifiedReferrers,
    startTime,
    endTime,
    subregistryId,
    rulesUrl,
  } satisfies ReferralProgramRules;

  validateReferralProgramRules(result);

  return result;
};
