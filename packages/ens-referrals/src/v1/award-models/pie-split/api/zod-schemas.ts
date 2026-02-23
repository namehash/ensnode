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

import {
  makeReferralProgramStatusSchema,
  makeReferrerLeaderboardPageContextSchema,
} from "../../shared/api/zod-schemas";
import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
import { ReferralProgramAwardModels } from "../../shared/rules";

/**
 * Schema for {@link ReferralProgramRulesPieSplit}.
 */
export const makeReferralProgramRulesPieSplitSchema = (
  valueLabel: string = "ReferralProgramRulesPieSplit",
) =>
  z
    .object({
      awardModel: z.literal("pie-split"),
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
 * Schema for {@link AwardedReferrerMetricsPieSplit} (with numeric rank).
 */
export const makeAwardedReferrerMetricsPieSplitSchema = (
  valueLabel: string = "AwardedReferrerMetricsPieSplit",
) =>
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
 * Schema for {@link UnrankedReferrerMetricsPieSplit} (with null rank).
 */
export const makeUnrankedReferrerMetricsPieSplitSchema = (
  valueLabel: string = "UnrankedReferrerMetricsPieSplit",
) =>
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
 * Schema for {@link AggregatedReferrerMetricsPieSplit}.
 */
export const makeAggregatedReferrerMetricsPieSplitSchema = (
  valueLabel: string = "AggregatedReferrerMetricsPieSplit",
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

/**
 * Schema for {@link ReferrerEditionMetricsRankedPieSplit}.
 */
export const makeReferrerEditionMetricsRankedPieSplitSchema = (
  valueLabel: string = "ReferrerEditionMetricsRankedPieSplit",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.PieSplit),
      type: z.literal(ReferrerEditionMetricsTypeIds.Ranked),
      rules: makeReferralProgramRulesPieSplitSchema(`${valueLabel}.rules`),
      referrer: makeAwardedReferrerMetricsPieSplitSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsPieSplitSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
      status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });

/**
 * Schema for {@link ReferrerEditionMetricsUnrankedPieSplit}.
 */
export const makeReferrerEditionMetricsUnrankedPieSplitSchema = (
  valueLabel: string = "ReferrerEditionMetricsUnrankedPieSplit",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.PieSplit),
      type: z.literal(ReferrerEditionMetricsTypeIds.Unranked),
      rules: makeReferralProgramRulesPieSplitSchema(`${valueLabel}.rules`),
      referrer: makeUnrankedReferrerMetricsPieSplitSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsPieSplitSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
      status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });

/**
 * Schema for all {@link ReferrerEditionMetrics} variants of the pie-split award model
 * (both ranked and unranked).
 */
export const makeReferrerEditionMetricsPieSplitSchema = (
  valueLabel: string = "ReferrerEditionMetricsPieSplit",
) =>
  z.discriminatedUnion("type", [
    makeReferrerEditionMetricsRankedPieSplitSchema(valueLabel),
    makeReferrerEditionMetricsUnrankedPieSplitSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferrerLeaderboardPagePieSplit}.
 */
export const makeReferrerLeaderboardPagePieSplitSchema = (
  valueLabel: string = "ReferrerLeaderboardPagePieSplit",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.PieSplit),
      rules: makeReferralProgramRulesPieSplitSchema(`${valueLabel}.rules`),
      referrers: z.array(
        makeAwardedReferrerMetricsPieSplitSchema(`${valueLabel}.referrers[record]`),
      ),
      aggregatedMetrics: makeAggregatedReferrerMetricsPieSplitSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
      pageContext: makeReferrerLeaderboardPageContextSchema(`${valueLabel}.pageContext`),
      status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });
