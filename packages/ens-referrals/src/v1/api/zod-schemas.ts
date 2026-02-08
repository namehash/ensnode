/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */

import z from "zod/v4";

import {
  makeAccountIdSchema,
  makeDurationSchema,
  makeFiniteNonNegativeNumberSchema,
  makeLowercaseAddressSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makePriceEthSchema,
  makePriceUsdcSchema,
  makeUnixTimestampSchema,
  makeUrlSchema,
} from "@ensnode/ensnode-sdk/internal";

import type { ReferralProgramEditionSlug } from "../edition";
import {
  type ReferrerEditionMetricsRanked,
  ReferrerEditionMetricsTypeIds,
} from "../edition-metrics";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "../leaderboard-page";
import {
  MAX_EDITIONS_PER_REQUEST,
  ReferralProgramEditionConfigSetResponseCodes,
  ReferrerLeaderboardPageResponseCodes,
  ReferrerMetricsEditionsResponseCodes,
} from "./types";

/**
 * Schema for {@link ReferralProgramRules}
 */
export const makeReferralProgramRulesSchema = (valueLabel: string = "ReferralProgramRules") =>
  z
    .object({
      totalAwardPoolValue: makePriceUsdcSchema(`${valueLabel}.totalAwardPoolValue`),
      maxQualifiedReferrers: makeNonNegativeIntegerSchema(`${valueLabel}.maxQualifiedReferrers`),
      startTime: makeUnixTimestampSchema(`${valueLabel}.startTime`),
      endTime: makeUnixTimestampSchema(`${valueLabel}.endTime`),
      subregistryId: makeAccountIdSchema(`${valueLabel}.subregistryId`),
      rulesUrl: makeUrlSchema(`${valueLabel}.rulesUrl`),
    })
    .refine((data) => data.endTime >= data.startTime, {
      message: `${valueLabel}.endTime must be >= ${valueLabel}.startTime`,
      path: ["endTime"],
    });

/**
 * Schema for AwardedReferrerMetrics (with numeric rank)
 */
export const makeAwardedReferrerMetricsSchema = (valueLabel: string = "AwardedReferrerMetrics") =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
    totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
    score: makeFiniteNonNegativeNumberSchema(`${valueLabel}.score`),
    rank: makePositiveIntegerSchema(`${valueLabel}.rank`),
    isQualified: z.boolean(),
    finalScoreBoost: makeFiniteNonNegativeNumberSchema(`${valueLabel}.finalScoreBoost`).max(
      1,
      `${valueLabel}.finalScoreBoost must be <= 1`,
    ),
    finalScore: makeFiniteNonNegativeNumberSchema(`${valueLabel}.finalScore`),
    awardPoolShare: makeFiniteNonNegativeNumberSchema(`${valueLabel}.awardPoolShare`).max(
      1,
      `${valueLabel}.awardPoolShare must be <= 1`,
    ),
    awardPoolApproxValue: makePriceUsdcSchema(`${valueLabel}.awardPoolApproxValue`),
  });

/**
 * Schema for UnrankedReferrerMetrics (with null rank)
 */
export const makeUnrankedReferrerMetricsSchema = (valueLabel: string = "UnrankedReferrerMetrics") =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
    totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
    score: makeFiniteNonNegativeNumberSchema(`${valueLabel}.score`),
    rank: z.null(),
    isQualified: z.literal(false),
    finalScoreBoost: makeFiniteNonNegativeNumberSchema(`${valueLabel}.finalScoreBoost`).max(
      1,
      `${valueLabel}.finalScoreBoost must be <= 1`,
    ),
    finalScore: makeFiniteNonNegativeNumberSchema(`${valueLabel}.finalScore`),
    awardPoolShare: makeFiniteNonNegativeNumberSchema(`${valueLabel}.awardPoolShare`).max(
      1,
      `${valueLabel}.awardPoolShare must be <= 1`,
    ),
    awardPoolApproxValue: makePriceUsdcSchema(`${valueLabel}.awardPoolApproxValue`),
  });

/**
 * Schema for AggregatedReferrerMetrics
 */
export const makeAggregatedReferrerMetricsSchema = (
  valueLabel: string = "AggregatedReferrerMetrics",
) =>
  z.object({
    grandTotalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.grandTotalReferrals`),
    grandTotalIncrementalDuration: makeDurationSchema(
      `${valueLabel}.grandTotalIncrementalDuration`,
    ),
    grandTotalRevenueContribution: makePriceEthSchema(
      `${valueLabel}.grandTotalRevenueContribution`,
    ),
    grandTotalQualifiedReferrersFinalScore: makeFiniteNonNegativeNumberSchema(
      `${valueLabel}.grandTotalQualifiedReferrersFinalScore`,
    ),
    minFinalScoreToQualify: makeFiniteNonNegativeNumberSchema(
      `${valueLabel}.minFinalScoreToQualify`,
    ),
  });

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
 * Schema for ReferrerLeaderboardPage
 */
export const makeReferrerLeaderboardPageSchema = (valueLabel: string = "ReferrerLeaderboardPage") =>
  z.object({
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    referrers: z.array(makeAwardedReferrerMetricsSchema(`${valueLabel}.referrers[record]`)),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    pageContext: makeReferrerLeaderboardPageContextSchema(`${valueLabel}.pageContext`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerLeaderboardPageResponseOk}
 */
export const makeReferrerLeaderboardPageResponseOkSchema = (
  valueLabel: string = "ReferrerLeaderboardPageResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferrerLeaderboardPageResponseCodes.Ok),
    data: makeReferrerLeaderboardPageSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link ReferrerLeaderboardPageResponseError}
 */
export const makeReferrerLeaderboardPageResponseErrorSchema = (
  _valueLabel: string = "ReferrerLeaderboardPageResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferrerLeaderboardPageResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferrerLeaderboardPageResponse}
 */
export const makeReferrerLeaderboardPageResponseSchema = (
  valueLabel: string = "ReferrerLeaderboardPageResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferrerLeaderboardPageResponseOkSchema(valueLabel),
    makeReferrerLeaderboardPageResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferrerEditionMetricsRanked} (with ranked metrics)
 */
export const makeReferrerEditionMetricsRankedSchema = (
  valueLabel: string = "ReferrerEditionMetricsRanked",
) =>
  z.object({
    type: z.literal(ReferrerEditionMetricsTypeIds.Ranked),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    referrer: makeAwardedReferrerMetricsSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerEditionMetricsUnranked} (with unranked metrics)
 */
export const makeReferrerEditionMetricsUnrankedSchema = (
  valueLabel: string = "ReferrerEditionMetricsUnranked",
) =>
  z.object({
    type: z.literal(ReferrerEditionMetricsTypeIds.Unranked),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    referrer: makeUnrankedReferrerMetricsSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerEditionMetrics} (discriminated union of ranked and unranked)
 */
export const makeReferrerEditionMetricsSchema = (valueLabel: string = "ReferrerEditionMetrics") =>
  z.discriminatedUnion("type", [
    makeReferrerEditionMetricsRankedSchema(valueLabel),
    makeReferrerEditionMetricsUnrankedSchema(valueLabel),
  ]);

/**
 * Schema for validating a {@link ReferralProgramEditionSlug}.
 *
 * Enforces the slug format invariant: lowercase letters (a-z), digits (0-9),
 * and hyphens (-) only. Must not start or end with a hyphen.
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
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      `${valueLabel} must contain only lowercase letters, digits, and hyphens. Must not start or end with a hyphen.`,
    );

/**
 * Schema for validating editions array (min 1, max {@link MAX_EDITIONS_PER_REQUEST}, distinct values).
 */
export const makeReferrerMetricsEditionsArraySchema = (
  valueLabel: string = "ReferrerMetricsEditionsArray",
) =>
  z
    .array(makeReferralProgramEditionSlugSchema(`${valueLabel}[edition]`))
    .min(1, `${valueLabel} must contain at least 1 edition`)
    .max(
      MAX_EDITIONS_PER_REQUEST,
      `${valueLabel} must not contain more than ${MAX_EDITIONS_PER_REQUEST} editions`,
    )
    .refine(
      (editions) => {
        const uniqueEditions = new Set(editions);
        return uniqueEditions.size === editions.length;
      },
      { message: `${valueLabel} must not contain duplicate edition slugs` },
    );

/**
 * Schema for {@link ReferrerMetricsEditionsRequest}
 */
export const makeReferrerMetricsEditionsRequestSchema = (
  valueLabel: string = "ReferrerMetricsEditionsRequest",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    editions: makeReferrerMetricsEditionsArraySchema(`${valueLabel}.editions`),
  });

/**
 * Schema for {@link ReferrerMetricsEditionsResponseOk}
 */
export const makeReferrerMetricsEditionsResponseOkSchema = (
  valueLabel: string = "ReferrerMetricsEditionsResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferrerMetricsEditionsResponseCodes.Ok),
    data: z.record(
      makeReferralProgramEditionSlugSchema(`${valueLabel}.data[edition]`),
      makeReferrerEditionMetricsSchema(`${valueLabel}.data[edition]`),
    ),
  });

/**
 * Schema for {@link ReferrerMetricsEditionsResponseError}
 */
export const makeReferrerMetricsEditionsResponseErrorSchema = (
  _valueLabel: string = "ReferrerMetricsEditionsResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferrerMetricsEditionsResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferrerMetricsEditionsResponse}
 */
export const makeReferrerMetricsEditionsResponseSchema = (
  valueLabel: string = "ReferrerMetricsEditionsResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferrerMetricsEditionsResponseOkSchema(valueLabel),
    makeReferrerMetricsEditionsResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for validating a {@link ReferralProgramEditionConfig}.
 */
export const makeReferralProgramEditionConfigSchema = (
  valueLabel: string = "ReferralProgramEditionConfig",
) =>
  z.object({
    slug: makeReferralProgramEditionSlugSchema(`${valueLabel}.slug`),
    displayName: z.string().min(1, `${valueLabel}.displayName must not be empty`),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
  });

/**
 * Schema for validating referral program edition config set array.
 */
export const makeReferralProgramEditionConfigSetArraySchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetArray",
) =>
  z
    .array(makeReferralProgramEditionConfigSchema(`${valueLabel}[edition]`))
    .min(1, `${valueLabel} must contain at least one edition`)
    .refine(
      (editions) => {
        const slugs = new Set<string>();
        for (const edition of editions) {
          if (slugs.has(edition.slug)) return false;
          slugs.add(edition.slug);
        }
        return true;
      },
      { message: `${valueLabel} must not contain duplicate edition slugs` },
    );

/**
 * Schema for {@link ReferralProgramEditionConfigSetData}.
 */
export const makeReferralProgramEditionConfigSetDataSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetData",
) =>
  z.object({
    editions: makeReferralProgramEditionConfigSetArraySchema(`${valueLabel}.editions`),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponseOk}.
 */
export const makeReferralProgramEditionConfigSetResponseOkSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionConfigSetResponseCodes.Ok),
    data: makeReferralProgramEditionConfigSetDataSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponseError}.
 */
export const makeReferralProgramEditionConfigSetResponseErrorSchema = (
  _valueLabel: string = "ReferralProgramEditionConfigSetResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionConfigSetResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponse}.
 */
export const makeReferralProgramEditionConfigSetResponseSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferralProgramEditionConfigSetResponseOkSchema(valueLabel),
    makeReferralProgramEditionConfigSetResponseErrorSchema(valueLabel),
  ]);
