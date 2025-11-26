/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */

import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "@namehash/ens-referrals";
import z from "zod/v4";

import {
  makeDurationSchema,
  makeFiniteNonNegativeNumberSchema,
  makeLowercaseAddressSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
} from "../shared/zod-schemas";
import { ReferrerLeaderboardPageResponseCodes } from "./types";

/**
 * Schema for ReferralProgramRules
 */
export const makeReferralProgramRulesSchema = (valueLabel: string = "ReferralProgramRules") =>
  z.object({
    totalAwardPoolValue: makeFiniteNonNegativeNumberSchema(`${valueLabel}.totalAwardPoolValue`),
    maxQualifiedReferrers: makeNonNegativeIntegerSchema(`${valueLabel}.maxQualifiedReferrers`),
    startTime: makeUnixTimestampSchema(`${valueLabel}.startTime`),
    endTime: makeUnixTimestampSchema(`${valueLabel}.endTime`),
  });

/**
 * Schema for AwardedReferrerMetrics
 */
export const makeAwardedReferrerMetricsSchema = (valueLabel: string = "AwardedReferrerMetrics") =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
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
    awardPoolApproxValue: makeFiniteNonNegativeNumberSchema(`${valueLabel}.awardPoolApproxValue`),
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
    grandTotalQualifiedReferrersFinalScore: makeFiniteNonNegativeNumberSchema(
      `${valueLabel}.grandTotalQualifiedReferrersFinalScore`,
    ),
  });

export const makeReferrerLeaderboardPaginationContextSchema = (
  valueLabel: string = "ReferrerLeaderboardPaginationContext",
) =>
  z.object({
    page: makePositiveIntegerSchema(`${valueLabel}.page`),
    itemsPerPage: makePositiveIntegerSchema(`${valueLabel}.itemsPerPage`).max(
      REFERRERS_PER_LEADERBOARD_PAGE_MAX,
      `${valueLabel}.itemsPerPage must not exceed ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}`,
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
    referrers: z.array(makeAwardedReferrerMetricsSchema(`${valueLabel}.referrers[item]`)),
    aggregatedMetrics: makeAggregatedReferrerMetricsSchema(`${valueLabel}.aggregatedMetrics`),
    paginationContext: makeReferrerLeaderboardPaginationContextSchema(
      `${valueLabel}.paginationContext`,
    ),
    updatedAt: makeUnixTimestampSchema(`${valueLabel}.updatedAt`),
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
  z.union([
    makeReferrerLeaderboardPageResponseOkSchema(valueLabel),
    makeReferrerLeaderboardPageResponseErrorSchema(valueLabel),
  ]);
