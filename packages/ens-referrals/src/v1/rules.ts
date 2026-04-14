import type { ReferralProgramRulesPieSplit } from "./award-models/pie-split/rules";
import type { ReferralProgramRulesRevShareCap } from "./award-models/rev-share-cap/rules";
import type { ReferralProgramRulesUnrecognized } from "./award-models/shared/rules";

/**
 * The rules of a referral program edition.
 *
 * Use `awardModel` to discriminate between rule types at runtime:
 * - `"pie-split"` → {@link ReferralProgramRulesPieSplit}
 * - `"rev-share-cap"` → {@link ReferralProgramRulesRevShareCap}
 * - `"unrecognized"` → {@link ReferralProgramRulesUnrecognized} (client-side forward-compatibility
 *   placeholder for editions whose `awardModel` string is not known to this client version)
 *
 * Internal business logic only handles the known variants (`pie-split`, `rev-share-cap`).
 * Unrecognized editions should be skipped with a warning log rather than crashing.
 */
export type ReferralProgramRules =
  | ReferralProgramRulesPieSplit
  | ReferralProgramRulesRevShareCap
  | ReferralProgramRulesUnrecognized;
