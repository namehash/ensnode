import type { AccountId, PriceUsdc, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { makeAccountIdSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "../../number";
import { validateUnixTimestamp } from "../../time";
import { type BaseReferralProgramRules, ReferralProgramAwardModels } from "../shared/rules";

export interface ReferralProgramRulesPieSplit extends BaseReferralProgramRules {
  /**
   * Discriminant: identifies this as a "pie-split" award model edition.
   *
   * In pie-split, the top-N referrers split an award pool proportionally
   * based on their scored duration (with rank-based boost).
   */
  awardModel: typeof ReferralProgramAwardModels.PieSplit;

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
}

export const validateReferralProgramRulesPieSplit = (rules: ReferralProgramRulesPieSplit): void => {
  const priceUsdcSchema = makePriceUsdcSchema("ReferralProgramRulesPieSplit.totalAwardPoolValue");
  const parseResult = priceUsdcSchema.safeParse(rules.totalAwardPoolValue);
  if (!parseResult.success) {
    throw new Error(
      `ReferralProgramRulesPieSplit: totalAwardPoolValue validation failed: ${parseResult.error.message}`,
    );
  }

  const accountIdSchema = makeAccountIdSchema("ReferralProgramRulesPieSplit.subregistryId");
  const accountIdParseResult = accountIdSchema.safeParse(rules.subregistryId);
  if (!accountIdParseResult.success) {
    throw new Error(
      `ReferralProgramRulesPieSplit: subregistryId validation failed: ${accountIdParseResult.error.message}`,
    );
  }

  validateNonNegativeInteger(rules.maxQualifiedReferrers);
  validateUnixTimestamp(rules.startTime);
  validateUnixTimestamp(rules.endTime);

  if (!(rules.rulesUrl instanceof URL)) {
    throw new Error(
      `ReferralProgramRulesPieSplit: rulesUrl must be a URL instance, got ${typeof rules.rulesUrl}.`,
    );
  }

  if (rules.endTime < rules.startTime) {
    throw new Error(
      `ReferralProgramRulesPieSplit: startTime: ${rules.startTime} is after endTime: ${rules.endTime}.`,
    );
  }
};

export const buildReferralProgramRulesPieSplit = (
  totalAwardPoolValue: PriceUsdc,
  maxQualifiedReferrers: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
  subregistryId: AccountId,
  rulesUrl: URL,
): ReferralProgramRulesPieSplit => {
  const result = {
    awardModel: ReferralProgramAwardModels.PieSplit,
    totalAwardPoolValue,
    maxQualifiedReferrers,
    startTime,
    endTime,
    subregistryId,
    rulesUrl,
  } satisfies ReferralProgramRulesPieSplit;

  validateReferralProgramRulesPieSplit(result);

  return result;
};
