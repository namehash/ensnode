import type { AccountId, PriceUsdc, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "../../number";
import {
  type BaseReferralProgramRules,
  ReferralProgramAwardModels,
  validateBaseReferralProgramRules,
} from "../shared/rules";

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
  makePriceUsdcSchema("ReferralProgramRulesPieSplit.totalAwardPoolValue").parse(
    rules.totalAwardPoolValue,
  );

  validateNonNegativeInteger(rules.maxQualifiedReferrers);

  validateBaseReferralProgramRules(rules);
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
