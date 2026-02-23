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

/**
 * Schema for {@link ReferralProgramRulesRevShareLimit}.
 */
export const makeReferralProgramRulesRevShareLimitSchema = (
  valueLabel: string = "ReferralProgramRulesRevShareLimit",
) =>
  z
    .object({
      awardModel: z.literal("rev-share-limit"),
      totalAwardPoolValue: makePriceUsdcSchema(`${valueLabel}.totalAwardPoolValue`),
      minQualifiedRevenueContribution: makePriceUsdcSchema(
        `${valueLabel}.minQualifiedRevenueContribution`,
      ),
      qualifiedRevenueShare: makeFiniteNonNegativeNumberSchema(
        `${valueLabel}.qualifiedRevenueShare`,
      ).max(1, `${valueLabel}.qualifiedRevenueShare must be <= 1`),
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
 * Schema for {@link AwardedReferrerMetricsRevShareLimit} (with numeric rank).
 */
export const makeAwardedReferrerMetricsRevShareLimitSchema = (
  valueLabel: string = "AwardedReferrerMetricsRevShareLimit",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
    totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
    totalBaseRevenueContribution: makePriceUsdcSchema(`${valueLabel}.totalBaseRevenueContribution`),
    rank: makePositiveIntegerSchema(`${valueLabel}.rank`),
    isQualified: z.boolean(),
    awardPoolApproxValue: makePriceUsdcSchema(`${valueLabel}.awardPoolApproxValue`),
  });

/**
 * Schema for {@link UnrankedReferrerMetricsRevShareLimit} (with null rank).
 */
export const makeUnrankedReferrerMetricsRevShareLimitSchema = (
  valueLabel: string = "UnrankedReferrerMetricsRevShareLimit",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
    totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
    totalBaseRevenueContribution: makePriceUsdcSchema(`${valueLabel}.totalBaseRevenueContribution`),
    rank: z.null(),
    isQualified: z.literal(false),
    awardPoolApproxValue: makePriceUsdcSchema(`${valueLabel}.awardPoolApproxValue`),
  });

/**
 * Schema for {@link AggregatedReferrerMetricsRevShareLimit}.
 */
export const makeAggregatedReferrerMetricsRevShareLimitSchema = (
  valueLabel: string = "AggregatedReferrerMetricsRevShareLimit",
) =>
  z.object({
    grandTotalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.grandTotalReferrals`),
    grandTotalIncrementalDuration: makeDurationSchema(
      `${valueLabel}.grandTotalIncrementalDuration`,
    ),
    grandTotalRevenueContribution: makePriceEthSchema(
      `${valueLabel}.grandTotalRevenueContribution`,
    ),
    awardPoolRemaining: makePriceUsdcSchema(`${valueLabel}.awardPoolRemaining`),
  });

/**
 * Schema for {@link ReferrerEditionMetricsRankedRevShareLimit}.
 */
export const makeReferrerEditionMetricsRankedRevShareLimitSchema = (
  valueLabel: string = "ReferrerEditionMetricsRankedRevShareLimit",
) =>
  z.object({
    type: z.literal(ReferrerEditionMetricsTypeIds.Ranked),
    rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
    referrer: makeAwardedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
      `${valueLabel}.aggregatedMetrics`,
    ),
    status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerEditionMetricsUnrankedRevShareLimit}.
 */
export const makeReferrerEditionMetricsUnrankedRevShareLimitSchema = (
  valueLabel: string = "ReferrerEditionMetricsUnrankedRevShareLimit",
) =>
  z.object({
    type: z.literal(ReferrerEditionMetricsTypeIds.Unranked),
    rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
    referrer: makeUnrankedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrer`),
    aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
      `${valueLabel}.aggregatedMetrics`,
    ),
    status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link ReferrerLeaderboardPageRevShareLimit}.
 */
export const makeReferrerLeaderboardPageRevShareLimitSchema = (
  valueLabel: string = "ReferrerLeaderboardPageRevShareLimit",
) =>
  z.object({
    rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
    referrers: z.array(
      makeAwardedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrers[record]`),
    ),
    aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
      `${valueLabel}.aggregatedMetrics`,
    ),
    pageContext: makeReferrerLeaderboardPageContextSchema(`${valueLabel}.pageContext`),
    status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });
