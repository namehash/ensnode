import {
  REFERRAL_PROGRAM_EDITION_SLUG_PATTERN,
  type ReferralProgramEditionSlug,
} from "../../edition";
import type {
  BaseReferralProgramRules,
  ReferralProgramAwardModel,
  ReferralProgramAwardModels,
  ReferralProgramRulesUnrecognized,
} from "./rules";
import type { ReferralProgramEditionStatusId } from "./status";

/**
 * Base fields shared by all edition summary variants.
 */
export interface BaseReferralProgramEditionSummary {
  /**
   * Discriminant: identifies the award model for this edition.
   *
   * @invariant Always equals `rules.awardModel`.
   */
  awardModel: ReferralProgramAwardModel;

  /**
   * Unique slug identifier for the edition.
   */
  slug: ReferralProgramEditionSlug;

  /**
   * Human-readable display name for the edition.
   */
  displayName: string;

  /**
   * The current runtime status of the edition.
   */
  status: ReferralProgramEditionStatusId;

  /**
   * The rules for this edition. Per-model subtypes narrow this to their specific rules type.
   */
  rules: BaseReferralProgramRules;
}

/**
 * Edition summary for an edition whose `awardModel` is not recognized by this client version.
 *
 * @remarks
 * This is a **client-side forward-compatibility** type only. It is never serialized or produced
 * by the server. When the server sends a new award model, older clients preserve the edition
 * summary rather than crashing, and downstream code should handle it gracefully.
 */
export interface ReferralProgramEditionSummaryUnrecognized
  extends BaseReferralProgramEditionSummary {
  /**
   * Discriminant — always `"unrecognized"`.
   */
  awardModel: typeof ReferralProgramAwardModels.Unrecognized;

  /**
   * The unrecognized rules — preserves `originalAwardModel` for logging/debugging.
   */
  rules: ReferralProgramRulesUnrecognized;
}

export const validateBaseReferralProgramEditionSummary = (
  summary: BaseReferralProgramEditionSummary,
): void => {
  if (!REFERRAL_PROGRAM_EDITION_SLUG_PATTERN.test(summary.slug)) {
    throw new Error(
      `BaseReferralProgramEditionSummary: slug "${summary.slug}" does not match required pattern ${REFERRAL_PROGRAM_EDITION_SLUG_PATTERN}.`,
    );
  }

  if (summary.displayName.length === 0) {
    throw new Error("BaseReferralProgramEditionSummary: displayName must not be empty.");
  }

  if (summary.awardModel !== summary.rules.awardModel) {
    throw new Error(
      `BaseReferralProgramEditionSummary: awardModel (${summary.awardModel}) must equal rules.awardModel (${summary.rules.awardModel}).`,
    );
  }
};
