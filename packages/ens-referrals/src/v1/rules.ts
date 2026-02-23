import type { ReferralProgramRulesPieSplit } from "./award-models/pie-split/rules";
import type { ReferralProgramRulesRevShareLimit } from "./award-models/rev-share-limit/rules";

/**
 * The rules of a referral program edition.
 *
 * Use `awardModel` to discriminate between rule types at runtime.
 * Internal business logic only handles the known variants listed here.
 */
export type ReferralProgramRules = ReferralProgramRulesPieSplit | ReferralProgramRulesRevShareLimit;
