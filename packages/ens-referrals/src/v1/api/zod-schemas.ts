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

import type { ReferralProgramCycleSlug } from "../cycle";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "../leaderboard-page";
import { type ReferrerDetailRanked, ReferrerDetailTypeIds } from "../referrer-detail";
import {
  MAX_CYCLES_PER_REQUEST,
  ReferralProgramCycleConfigSetResponseCodes,
  ReferrerDetailCyclesResponseCodes,
  ReferrerLeaderboardPageResponseCodes,
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
 * Schema for {@link ReferrerDetailRanked} (with ranked metrics)
 */
export const makeReferrerDetailRankedSchema = (valueLabel: string = "ReferrerDetailRanked") =>
  z.object({
    type: z.literal(ReferrerDetailTypeIds.Ranked),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    referrer: makeAwardedReferrerMetricsSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerDetailUnranked} (with unranked metrics)
 */
export const makeReferrerDetailUnrankedSchema = (valueLabel: string = "ReferrerDetailUnranked") =>
  z.object({
    type: z.literal(ReferrerDetailTypeIds.Unranked),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    referrer: makeUnrankedReferrerMetricsSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerDetail} (discriminated union of ranked and unranked)
 */
export const makeReferrerDetailSchema = (valueLabel: string = "ReferrerDetail") =>
  z.discriminatedUnion("type", [
    makeReferrerDetailRankedSchema(valueLabel),
    makeReferrerDetailUnrankedSchema(valueLabel),
  ]);

/**
 * Schema for validating cycles array (min 1, max {@link MAX_CYCLES_PER_REQUEST}, distinct values).
 */
export const makeReferrerDetailCyclesArraySchema = (
  valueLabel: string = "ReferrerDetailCyclesArray",
) =>
  z
    .array(makeReferralProgramCycleSlugSchema(`${valueLabel}[cycle]`))
    .min(1, `${valueLabel} must contain at least 1 cycle`)
    .max(
      MAX_CYCLES_PER_REQUEST,
      `${valueLabel} must not contain more than ${MAX_CYCLES_PER_REQUEST} cycles`,
    )
    .refine(
      (cycles) => {
        const uniqueCycles = new Set(cycles);
        return uniqueCycles.size === cycles.length;
      },
      { message: `${valueLabel} must not contain duplicate cycle slugs` },
    );

/**
 * Schema for {@link ReferrerDetailCyclesRequest}
 */
export const makeReferrerDetailCyclesRequestSchema = (
  valueLabel: string = "ReferrerDetailCyclesRequest",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    cycles: makeReferrerDetailCyclesArraySchema(`${valueLabel}.cycles`),
  });

/**
 * Schema for {@link ReferrerDetailCyclesResponseOk}
 */
export const makeReferrerDetailCyclesResponseOkSchema = (
  valueLabel: string = "ReferrerDetailCyclesResponse",
) =>
  z.object({
    responseCode: z.literal(ReferrerDetailCyclesResponseCodes.Ok),
    data: z.record(
      makeReferralProgramCycleSlugSchema(`${valueLabel}.data[cycle]`),
      makeReferrerDetailSchema(`${valueLabel}.data[cycle]`),
    ),
  });

/**
 * Schema for {@link ReferrerDetailCyclesResponseError}
 */
export const makeReferrerDetailCyclesResponseErrorSchema = (
  _valueLabel: string = "ReferrerDetailCyclesResponse",
) =>
  z.object({
    responseCode: z.literal(ReferrerDetailCyclesResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferrerDetailCyclesResponse}
 */
export const makeReferrerDetailCyclesResponseSchema = (
  valueLabel: string = "ReferrerDetailCyclesResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferrerDetailCyclesResponseOkSchema(valueLabel),
    makeReferrerDetailCyclesResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for validating a {@link ReferralProgramCycleSlug}.
 *
 * Enforces the slug format invariant: lowercase letters (a-z), digits (0-9),
 * and hyphens (-) only. Must not start or end with a hyphen.
 *
 * Runtime validation against configured cycles happens at the business logic level.
 */
export const makeReferralProgramCycleSlugSchema = (
  valueLabel: string = "ReferralProgramCycleSlug",
) =>
  z
    .string()
    .min(1, `${valueLabel} must not be empty`)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      `${valueLabel} must contain only lowercase letters, digits, and hyphens. Must not start or end with a hyphen.`,
    );

/**
 * Schema for validating a {@link ReferralProgramCycleConfig}.
 */
export const makeReferralProgramCycleConfigSchema = (
  valueLabel: string = "ReferralProgramCycleConfig",
) =>
  z.object({
    slug: makeReferralProgramCycleSlugSchema(`${valueLabel}.slug`),
    displayName: z.string().min(1, `${valueLabel}.displayName must not be empty`),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
  });

/**
 * Schema for validating referral program cycle config set array.
 */
export const makeReferralProgramCycleConfigSetArraySchema = (
  valueLabel: string = "ReferralProgramCycleConfigSetArray",
) =>
  z
    .array(makeReferralProgramCycleConfigSchema(`${valueLabel}[cycle]`))
    .min(1, `${valueLabel} must contain at least one cycle`)
    .refine(
      (cycles) => {
        const slugs = new Set<string>();
        for (const cycle of cycles) {
          if (slugs.has(cycle.slug)) return false;
          slugs.add(cycle.slug);
        }
        return true;
      },
      { message: `${valueLabel} must not contain duplicate cycle slugs` },
    );

/**
 * Schema for {@link ReferralProgramCycleConfigSetData}.
 */
export const makeReferralProgramCycleConfigSetDataSchema = (
  valueLabel: string = "ReferralProgramCycleConfigSetData",
) =>
  z.object({
    cycles: z.array(makeReferralProgramCycleConfigSchema(`${valueLabel}.cycles[cycle]`)),
  });

/**
 * Schema for {@link ReferralProgramCycleConfigSetResponseOk}.
 */
export const makeReferralProgramCycleConfigSetResponseOkSchema = (
  valueLabel: string = "ReferralProgramCycleConfigSetResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramCycleConfigSetResponseCodes.Ok),
    data: makeReferralProgramCycleConfigSetDataSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link ReferralProgramCycleConfigSetResponseError}.
 */
export const makeReferralProgramCycleConfigSetResponseErrorSchema = (
  _valueLabel: string = "ReferralProgramCycleConfigSetResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramCycleConfigSetResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferralProgramCycleConfigSetResponse}.
 */
export const makeReferralProgramCycleConfigSetResponseSchema = (
  valueLabel: string = "ReferralProgramCycleConfigSetResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferralProgramCycleConfigSetResponseOkSchema(valueLabel),
    makeReferralProgramCycleConfigSetResponseErrorSchema(valueLabel),
  ]);
