import z from "zod/v4";

import {
  makeDurationSchema,
  makeFiniteNonNegativeNumberSchema,
  makeLowercaseAddressSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makePriceEthSchema,
  makePriceUsdcSchema,
  makeUnixTimestampSchema,
} from "@ensnode/ensnode-sdk/internal";

import { normalizeAddress } from "../../../address";
import {
  makeBaseReferralProgramEditionSummarySchema,
  makeBaseReferralProgramRulesSchema,
  makeBaseReferrerLeaderboardPageSchema,
  makeReferralProgramStatusSchema,
} from "../../shared/api/zod-schemas";
import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
import { ReferralProgramAwardModels } from "../../shared/rules";

/**
 * Schema for {@link ReferralProgramEditionDisqualification}.
 */
export const makeReferralProgramEditionDisqualificationSchema = (
  valueLabel = "ReferralProgramEditionDisqualification",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    reason: z.string().trim().min(1, `${valueLabel}.reason must not be empty`),
  });

/**
 * Schema for {@link ReferralProgramRulesRevShareLimit}.
 */
export const makeReferralProgramRulesRevShareLimitSchema = (
  valueLabel: string = "ReferralProgramRulesRevShareLimit",
) =>
  makeBaseReferralProgramRulesSchema(valueLabel).safeExtend({
    awardModel: z.literal(ReferralProgramAwardModels.RevShareLimit),
    totalAwardPoolValue: makePriceUsdcSchema(`${valueLabel}.totalAwardPoolValue`),
    minBaseRevenueContribution: makePriceUsdcSchema(`${valueLabel}.minBaseRevenueContribution`),
    maxBaseRevenueShare: makeFiniteNonNegativeNumberSchema(`${valueLabel}.maxBaseRevenueShare`).max(
      1,
      `${valueLabel}.maxBaseRevenueShare must be <= 1`,
    ),
    disqualifications: z
      .array(
        makeReferralProgramEditionDisqualificationSchema(`${valueLabel}.disqualifications[item]`),
      )
      .refine(
        (items) => {
          const addresses = items.map((item) => normalizeAddress(item.referrer));
          return new Set(addresses).size === addresses.length;
        },
        {
          message: `${valueLabel}.disqualifications must not contain duplicate referrer addresses`,
        },
      )
      .default([]),
  });

/**
 * Schema for {@link AwardedReferrerMetricsRevShareLimit} (with numeric rank).
 */
export const makeAwardedReferrerMetricsRevShareLimitSchema = (
  valueLabel: string = "AwardedReferrerMetricsRevShareLimit",
) =>
  z
    .object({
      referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
      totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
      totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
      totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
      totalBaseRevenueContribution: makePriceUsdcSchema(
        `${valueLabel}.totalBaseRevenueContribution`,
      ),
      rank: makePositiveIntegerSchema(`${valueLabel}.rank`),
      isQualified: z.boolean(),
      uncappedAwardValue: makePriceUsdcSchema(`${valueLabel}.uncappedAwardValue`),
      cappedAwardValue: makePriceUsdcSchema(`${valueLabel}.cappedAwardValue`),
      isAdminDisqualified: z.boolean(),
      adminDisqualificationReason: z
        .string()
        .trim()
        .min(1, `${valueLabel}.adminDisqualificationReason must not be empty`)
        .nullable(),
    })
    .refine((data) => data.cappedAwardValue.amount <= data.uncappedAwardValue.amount, {
      message: `${valueLabel}.cappedAwardValue must be <= ${valueLabel}.uncappedAwardValue`,
      path: ["cappedAwardValue"],
    })
    .refine(
      (data) =>
        !data.isAdminDisqualified ||
        (data.isQualified === false && data.cappedAwardValue.amount === 0n),
      {
        message: `When ${valueLabel}.isAdminDisqualified is true, isQualified must be false and cappedAwardValue.amount must be 0`,
        path: ["isAdminDisqualified"],
      },
    )
    .refine((data) => data.isAdminDisqualified === (data.adminDisqualificationReason !== null), {
      message: `${valueLabel}.adminDisqualificationReason must be non-null iff isAdminDisqualified is true`,
      path: ["adminDisqualificationReason"],
    })
    .refine((data) => data.isQualified || data.cappedAwardValue.amount === 0n, {
      message: `${valueLabel}.cappedAwardValue must be 0 when isQualified is false`,
      path: ["cappedAwardValue"],
    });

/**
 * Schema for {@link UnrankedReferrerMetricsRevShareLimit} (with null rank).
 */
export const makeUnrankedReferrerMetricsRevShareLimitSchema = (
  valueLabel: string = "UnrankedReferrerMetricsRevShareLimit",
) =>
  z
    .object({
      referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
      totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
      totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
      totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
      totalBaseRevenueContribution: makePriceUsdcSchema(
        `${valueLabel}.totalBaseRevenueContribution`,
      ),
      rank: z.null(),
      isQualified: z.literal(false),
      uncappedAwardValue: makePriceUsdcSchema(`${valueLabel}.uncappedAwardValue`),
      cappedAwardValue: makePriceUsdcSchema(`${valueLabel}.cappedAwardValue`),
      isAdminDisqualified: z.boolean(),
      adminDisqualificationReason: z
        .string()
        .trim()
        .min(1, `${valueLabel}.adminDisqualificationReason must not be empty`)
        .nullable(),
    })
    .refine(
      (data) => data.uncappedAwardValue.amount === 0n && data.cappedAwardValue.amount === 0n,
      {
        message: `${valueLabel}.uncappedAwardValue and cappedAwardValue must both be 0 for unranked referrers`,
        path: ["uncappedAwardValue", "cappedAwardValue"],
      },
    )
    .refine((data) => data.isAdminDisqualified === (data.adminDisqualificationReason !== null), {
      message: `${valueLabel}.adminDisqualificationReason must be non-null iff isAdminDisqualified is true`,
      path: ["adminDisqualificationReason"],
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
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareLimit),
      type: z.literal(ReferrerEditionMetricsTypeIds.Ranked),
      rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
      referrer: makeAwardedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
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
 * Schema for {@link ReferrerEditionMetricsUnrankedRevShareLimit}.
 */
export const makeReferrerEditionMetricsUnrankedRevShareLimitSchema = (
  valueLabel: string = "ReferrerEditionMetricsUnrankedRevShareLimit",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareLimit),
      type: z.literal(ReferrerEditionMetricsTypeIds.Unranked),
      rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
      referrer: makeUnrankedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
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
 * Schema for all {@link ReferrerEditionMetrics} variants of the rev-share-limit award model
 * (both ranked and unranked).
 */
export const makeReferrerEditionMetricsRevShareLimitSchema = (
  valueLabel: string = "ReferrerEditionMetricsRevShareLimit",
) =>
  z.discriminatedUnion("type", [
    makeReferrerEditionMetricsRankedRevShareLimitSchema(valueLabel),
    makeReferrerEditionMetricsUnrankedRevShareLimitSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferralProgramEditionSummaryRevShareLimit}.
 */
export const makeReferralProgramEditionSummaryRevShareLimitSchema = (
  valueLabel: string = "ReferralProgramEditionSummaryRevShareLimit",
) =>
  makeBaseReferralProgramEditionSummarySchema(valueLabel)
    .safeExtend({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareLimit),
      rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
      awardPoolRemaining: makePriceUsdcSchema(`${valueLabel}.awardPoolRemaining`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });

/**
 * Schema for {@link ReferrerLeaderboardPageRevShareLimit}.
 */
export const makeReferrerLeaderboardPageRevShareLimitSchema = (
  valueLabel: string = "ReferrerLeaderboardPageRevShareLimit",
) =>
  makeBaseReferrerLeaderboardPageSchema(valueLabel)
    .safeExtend({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareLimit),
      rules: makeReferralProgramRulesRevShareLimitSchema(`${valueLabel}.rules`),
      referrers: z.array(
        makeAwardedReferrerMetricsRevShareLimitSchema(`${valueLabel}.referrers[record]`),
      ),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareLimitSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });
