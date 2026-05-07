import z from "zod/v4";

import {
  makeAccountIdSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
  makeUrlSchema,
} from "@ensnode/ensnode-sdk/internal";

import { REFERRAL_PROGRAM_EDITION_SLUG_PATTERN } from "../../../edition";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "../leaderboard-page";
import { ReferralProgramEditionStatuses } from "../status";

/**
 * Schema for validating a {@link ReferralProgramEditionSlug}.
 *
 * Runtime validation against configured editions happens at the business logic level.
 */
export const makeReferralProgramEditionSlugSchema = (
  valueLabel: string = "ReferralProgramEditionSlug",
) =>
  z
    .string()
    .min(1, `${valueLabel} must not be empty`)
    .regex(
      REFERRAL_PROGRAM_EDITION_SLUG_PATTERN,
      `${valueLabel} must contain only lowercase letters, digits, and hyphens. Must not start or end with a hyphen.`,
    );

/**
 * Loose base schema for {@link BaseReferralProgramEditionConfig}.
 */
export const makeBaseReferralProgramEditionConfigSchema = (
  valueLabel: string = "BaseReferralProgramEditionConfig",
) =>
  z.object({
    slug: makeReferralProgramEditionSlugSchema(`${valueLabel}.slug`),
    displayName: z.string().min(1, `${valueLabel}.displayName must not be empty`),
    rules: makeBaseReferralProgramRulesSchema(`${valueLabel}.rules`),
  });

/**
 * Loose base schema for {@link BaseReferralProgramRules}.
 *
 * Accepts any string for `awardModel` to support forward-compatible parsing of unrecognized
 * models. Model-specific schemas override `awardModel` with a literal.
 */
export const makeBaseReferralProgramRulesSchema = (valueLabel: string) =>
  z
    .object({
      awardModel: z.string(),
      startTime: makeUnixTimestampSchema(`${valueLabel}.startTime`),
      endTime: makeUnixTimestampSchema(`${valueLabel}.endTime`),
      subregistryId: makeAccountIdSchema(`${valueLabel}.subregistryId`),
      rulesUrl: makeUrlSchema(`${valueLabel}.rulesUrl`),
      areAwardsDistributed: z.boolean(),
    })
    .refine((data) => data.endTime >= data.startTime, {
      message: `${valueLabel}.endTime must be >= ${valueLabel}.startTime`,
      path: ["endTime"],
    });

/**
 * Schema for {@link ReferrerLeaderboardPageContext}.
 */
export const makeReferrerLeaderboardPageContextSchema = (
  valueLabel: string = "ReferrerLeaderboardPageContext",
) =>
  z.object({
    page: makePositiveIntegerSchema(`${valueLabel}.page`),
    recordsPerPage: makePositiveIntegerSchema(`${valueLabel}.recordsPerPage`).max(
      REFERRERS_PER_LEADERBOARD_PAGE_MAX,
      `${valueLabel}.recordsPerPage must not exceed ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}`,
    ),
    totalRecords: makeNonNegativeIntegerSchema(`${valueLabel}.totalRecords`),
    totalPages: makePositiveIntegerSchema(`${valueLabel}.totalPages`),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    startIndex: z.optional(makeNonNegativeIntegerSchema(`${valueLabel}.startIndex`)),
    endIndex: z.optional(makeNonNegativeIntegerSchema(`${valueLabel}.endIndex`)),
  });

/**
 * Schema for referral program status field.
 * Validates that the status is one of the values in {@link ReferralProgramEditionStatuses}.
 */
export const makeReferralProgramStatusSchema = (_valueLabel: string = "status") =>
  z.enum(ReferralProgramEditionStatuses);

/**
 * Loose base schema for {@link BaseReferralProgramEditionSummary}.
 *
 * Accepts any string for `awardModel` to support forward-compatible parsing.
 */
export const makeBaseReferralProgramEditionSummarySchema = (valueLabel: string) =>
  makeBaseReferralProgramEditionConfigSchema(valueLabel).safeExtend({
    awardModel: z.string(),
    status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
  });

/**
 * Loose base schema for {@link BaseReferrerLeaderboardPage}.
 *
 * Accepts any string for `awardModel` to support forward-compatible parsing of unrecognized
 * models. Model-specific schemas override `awardModel` with a literal.
 */
export const makeBaseReferrerLeaderboardPageSchema = (valueLabel: string) =>
  z.object({
    awardModel: z.string(),
    pageContext: makeReferrerLeaderboardPageContextSchema(`${valueLabel}.pageContext`),
    status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });
