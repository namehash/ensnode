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
} from "@ensnode/ensnode-sdk/internal";

import type { ReferralProgramCycleId } from "../cycle";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "../leaderboard-page";
import { type ReferrerDetailRanked, ReferrerDetailTypeIds } from "../referrer-detail";
import {
  ReferrerDetailAllCyclesResponseCodes,
  ReferrerLeaderboardPageResponseCodes,
} from "./types";

/**
 * Schema for ReferralProgramRules
 */
export const makeReferralProgramRulesSchema = (valueLabel: string = "ReferralProgramRules") =>
  z
    .object({
      totalAwardPoolValue: makePriceUsdcSchema(`${valueLabel}.totalAwardPoolValue`),
      maxQualifiedReferrers: makeNonNegativeIntegerSchema(`${valueLabel}.maxQualifiedReferrers`),
      startTime: makeUnixTimestampSchema(`${valueLabel}.startTime`),
      endTime: makeUnixTimestampSchema(`${valueLabel}.endTime`),
      subregistryId: makeAccountIdSchema(`${valueLabel}.subregistryId`),
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
 * Schema for {@link ReferrerDetailAllCyclesResponseOk}
 * Accepts a record of cycle IDs to referrer details
 */
export const makeReferrerDetailAllCyclesResponseOkSchema = (
  valueLabel: string = "ReferrerDetailAllCyclesResponse",
) =>
  z.object({
    responseCode: z.literal(ReferrerDetailAllCyclesResponseCodes.Ok),
    data: z.record(
      makeReferralProgramCycleIdSchema(`${valueLabel}.data[cycle]`),
      z.discriminatedUnion("type", [
        makeReferrerDetailRankedSchema(`${valueLabel}.data[cycle]`),
        makeReferrerDetailUnrankedSchema(`${valueLabel}.data[cycle]`),
      ]),
    ),
  });

/**
 * Schema for {@link ReferrerDetailAllCyclesResponseError}
 */
export const makeReferrerDetailAllCyclesResponseErrorSchema = (
  _valueLabel: string = "ReferrerDetailAllCyclesResponse",
) =>
  z.object({
    responseCode: z.literal(ReferrerDetailAllCyclesResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferrerDetailAllCyclesResponse}
 */
export const makeReferrerDetailAllCyclesResponseSchema = (
  valueLabel: string = "ReferrerDetailAllCyclesResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferrerDetailAllCyclesResponseOkSchema(valueLabel),
    makeReferrerDetailAllCyclesResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for validating a {@link ReferralProgramCycleId}.
 *
 * Note: This accepts any non-empty string to support custom cycle IDs loaded from
 * CUSTOM_REFERRAL_PROGRAM_CYCLES. Runtime validation against configured cycles
 * happens at the business logic level.
 */
export const makeReferralProgramCycleIdSchema = (valueLabel: string = "ReferralProgramCycleId") =>
  z.string().min(1, `${valueLabel} must not be empty`);

/**
 * Schema for validating a {@link ReferralProgramCycle}.
 */
export const makeReferralProgramCycleSchema = (valueLabel: string = "ReferralProgramCycle") =>
  z.object({
    id: makeReferralProgramCycleIdSchema(`${valueLabel}.id`),
    displayName: z.string().min(1, `${valueLabel}.displayName must not be empty`),
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
    rulesUrl: z.url(`${valueLabel}.rulesUrl must be a valid URL`),
  });

/**
 * Schema for validating custom referral program cycles (array format from JSON).
 */
export const makeCustomReferralProgramCyclesSchema = (
  valueLabel: string = "CustomReferralProgramCycles",
) =>
  z
    .array(makeReferralProgramCycleSchema(`${valueLabel}[cycle]`))
    .min(1, `${valueLabel} must contain at least one cycle`);

/**
 * Schema for validating a {@link ReferralProgramCycleSet} (Map structure).
 */
export const makeReferralProgramCycleSetSchema = (valueLabel: string = "ReferralProgramCycleSet") =>
  z
    .instanceof(Map, {
      message: `${valueLabel} must be a Map`,
    })
    .refine(
      (map): map is Map<string, unknown> => {
        // Validate each entry in the map
        for (const [key, value] of map.entries()) {
          // Validate key is a string
          if (typeof key !== "string") {
            return false;
          }
          // Validate value structure using the cycle schema
          try {
            const parsed = makeReferralProgramCycleSchema(`${valueLabel}[${key}]`).parse(value);
            if (parsed.id !== key) {
              return false;
            }
          } catch {
            return false;
          }
        }
        return true;
      },
      {
        message: `${valueLabel} must be a Map<ReferralProgramCycleId, ReferralProgramCycle>`,
      },
    );
