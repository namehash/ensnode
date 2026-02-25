import type { AccountId, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { makeAccountIdSchema } from "@ensnode/ensnode-sdk/internal";

import { validateUnixTimestamp } from "../../time";

/**
 * Discriminant values for the award model used in a referral program edition.
 *
 * @remarks Clients MUST check `awardModel` before accessing model-specific fields.
 * Editions with unrecognized `awardModel` values are silently dropped during parsing
 * (see `makeReferralProgramEditionConfigSetArraySchema`), so clients will only ever
 * encounter award models listed here.
 */
export const ReferralProgramAwardModels = {
  PieSplit: "pie-split",
  RevShareLimit: "rev-share-limit",
} as const;

export type ReferralProgramAwardModel =
  (typeof ReferralProgramAwardModels)[keyof typeof ReferralProgramAwardModels];

/**
 * Base fields shared across all referral program rule types.
 *
 * Both `ReferralProgramRulesPieSplit` and `ReferralProgramRulesRevShareLimit` are structurally
 * compatible with this interface, so it can be used wherever only the common fields are needed
 * (e.g., `assertLeaderboardInputs`).
 */
export interface BaseReferralProgramRules {
  /**
   * Discriminant: identifies the award model for this edition.
   */
  awardModel: ReferralProgramAwardModel;

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

export const validateBaseReferralProgramRules = (rules: BaseReferralProgramRules): void => {
  makeAccountIdSchema("BaseReferralProgramRules.subregistryId").parse(rules.subregistryId);

  validateUnixTimestamp(rules.startTime);
  validateUnixTimestamp(rules.endTime);

  if (!(rules.rulesUrl instanceof URL)) {
    throw new Error(
      `BaseReferralProgramRules: rulesUrl must be a URL instance, got ${typeof rules.rulesUrl}.`,
    );
  }

  if (rules.endTime < rules.startTime) {
    throw new Error(
      `BaseReferralProgramRules: startTime: ${rules.startTime} is after endTime: ${rules.endTime}.`,
    );
  }
};
