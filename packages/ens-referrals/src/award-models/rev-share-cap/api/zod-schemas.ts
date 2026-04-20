import z from "zod/v4";

import {
  makeDurationSchema,
  makeFiniteNonNegativeNumberSchema,
  makeNonNegativeIntegerSchema,
  makeNormalizedAddressSchema,
  makePositiveIntegerSchema,
  makePriceEthSchema,
  makePriceUsdcSchema,
  makeUnixTimestampSchema,
} from "@ensnode/ensnode-sdk/internal";

import {
  makeBaseReferralProgramEditionSummarySchema,
  makeBaseReferralProgramRulesSchema,
  makeBaseReferrerLeaderboardPageSchema,
  makeReferralProgramStatusSchema,
} from "../../shared/api/zod-schemas";
import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
import { ReferralProgramAwardModels } from "../../shared/rules";
import { AdminActionTypes } from "../rules";

/**
 * Schema for {@link AdminActionDisqualification}.
 */
export const makeAdminActionDisqualificationSchema = (valueLabel = "AdminActionDisqualification") =>
  z.object({
    actionType: z.literal(AdminActionTypes.Disqualification),
    referrer: makeNormalizedAddressSchema(`${valueLabel}.referrer`),
    reason: z.string().trim().min(1, `${valueLabel}.reason must not be empty`),
  });

/**
 * Schema for {@link AdminActionWarning}.
 */
export const makeAdminActionWarningSchema = (valueLabel = "AdminActionWarning") =>
  z.object({
    actionType: z.literal(AdminActionTypes.Warning),
    referrer: makeNormalizedAddressSchema(`${valueLabel}.referrer`),
    reason: z.string().trim().min(1, `${valueLabel}.reason must not be empty`),
  });

/**
 * Schema for {@link AdminAction}.
 */
export const makeAdminActionSchema = (valueLabel = "AdminAction") =>
  z.discriminatedUnion("actionType", [
    makeAdminActionDisqualificationSchema(valueLabel),
    makeAdminActionWarningSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferralProgramRulesRevShareCap}.
 */
export const makeReferralProgramRulesRevShareCapSchema = (
  valueLabel: string = "ReferralProgramRulesRevShareCap",
) =>
  makeBaseReferralProgramRulesSchema(valueLabel).safeExtend({
    awardModel: z.literal(ReferralProgramAwardModels.RevShareCap),
    awardPool: makePriceUsdcSchema(`${valueLabel}.awardPool`),
    minBaseRevenueContribution: makePriceUsdcSchema(`${valueLabel}.minBaseRevenueContribution`),
    baseAnnualRevenueContribution: makePriceUsdcSchema(
      `${valueLabel}.baseAnnualRevenueContribution`,
    ),
    maxBaseRevenueShare: makeFiniteNonNegativeNumberSchema(`${valueLabel}.maxBaseRevenueShare`).max(
      1,
      `${valueLabel}.maxBaseRevenueShare must be <= 1`,
    ),
    adminActions: z
      .array(makeAdminActionSchema(`${valueLabel}.adminActions[item]`))
      // NOTE: addresses are already normalized, so string equivalence here is accurate
      .refine(
        (items) => {
          const referrers = items.map((a) => a.referrer);
          return new Set(referrers).size === referrers.length;
        },
        {
          message: `${valueLabel}.adminActions must not contain duplicate referrer addresses`,
        },
      )
      .default([]),
  });

/**
 * Schema for {@link AwardedReferrerMetricsRevShareCap} (with numeric rank).
 */
export const makeAwardedReferrerMetricsRevShareCapSchema = (
  valueLabel: string = "AwardedReferrerMetricsRevShareCap",
) =>
  z
    .object({
      referrer: makeNormalizedAddressSchema(`${valueLabel}.referrer`),
      totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
      totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
      totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
      totalBaseRevenueContribution: makePriceUsdcSchema(
        `${valueLabel}.totalBaseRevenueContribution`,
      ),
      rank: makePositiveIntegerSchema(`${valueLabel}.rank`),
      isQualified: z.boolean(),
      uncappedAward: makePriceUsdcSchema(`${valueLabel}.uncappedAward`),
      cappedAward: makePriceUsdcSchema(`${valueLabel}.cappedAward`),
      adminAction: makeAdminActionSchema(`${valueLabel}.adminAction`).nullable(),
    })
    .refine((data) => data.cappedAward.amount <= data.uncappedAward.amount, {
      message: `${valueLabel}.cappedAward must be <= ${valueLabel}.uncappedAward`,
      path: ["cappedAward"],
    })
    .refine(
      (data) =>
        data.adminAction?.actionType !== AdminActionTypes.Disqualification ||
        (data.isQualified === false && data.cappedAward.amount === 0n),
      {
        message: `When ${valueLabel}.adminAction.actionType is Disqualification, isQualified must be false and cappedAward.amount must be 0`,
        path: ["adminAction"],
      },
    )
    .refine((data) => data.isQualified || data.cappedAward.amount === 0n, {
      message: `${valueLabel}.cappedAward must be 0 when isQualified is false`,
      path: ["cappedAward"],
    })
    .refine((data) => data.adminAction === null || data.adminAction.referrer === data.referrer, {
      message: `${valueLabel}.adminAction.referrer must match ${valueLabel}.referrer`,
      path: ["adminAction", "referrer"],
    });

/**
 * Schema for {@link UnrankedReferrerMetricsRevShareCap} (with null rank).
 */
export const makeUnrankedReferrerMetricsRevShareCapSchema = (
  valueLabel: string = "UnrankedReferrerMetricsRevShareCap",
) =>
  z
    .object({
      referrer: makeNormalizedAddressSchema(`${valueLabel}.referrer`),
      totalReferrals: makeNonNegativeIntegerSchema(`${valueLabel}.totalReferrals`),
      totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
      totalRevenueContribution: makePriceEthSchema(`${valueLabel}.totalRevenueContribution`),
      totalBaseRevenueContribution: makePriceUsdcSchema(
        `${valueLabel}.totalBaseRevenueContribution`,
      ),
      rank: z.null(),
      isQualified: z.literal(false),
      uncappedAward: makePriceUsdcSchema(`${valueLabel}.uncappedAward`),
      cappedAward: makePriceUsdcSchema(`${valueLabel}.cappedAward`),
      adminAction: makeAdminActionSchema(`${valueLabel}.adminAction`).nullable(),
    })
    .refine((data) => data.totalReferrals === 0, {
      message: `${valueLabel}.totalReferrals must be 0 for unranked referrers`,
      path: ["totalReferrals"],
    })
    .refine((data) => data.totalIncrementalDuration === 0, {
      message: `${valueLabel}.totalIncrementalDuration must be 0 for unranked referrers`,
      path: ["totalIncrementalDuration"],
    })
    .refine((data) => data.totalRevenueContribution.amount === 0n, {
      message: `${valueLabel}.totalRevenueContribution must be 0 for unranked referrers`,
      path: ["totalRevenueContribution"],
    })
    .refine((data) => data.totalBaseRevenueContribution.amount === 0n, {
      message: `${valueLabel}.totalBaseRevenueContribution must be 0 for unranked referrers`,
      path: ["totalBaseRevenueContribution"],
    })
    .refine((data) => data.uncappedAward.amount === 0n, {
      message: `${valueLabel}.uncappedAward must be 0 for unranked referrers`,
      path: ["uncappedAward"],
    })
    .refine((data) => data.cappedAward.amount === 0n, {
      message: `${valueLabel}.cappedAward must be 0 for unranked referrers`,
      path: ["cappedAward"],
    })
    .refine((data) => data.adminAction === null || data.adminAction.referrer === data.referrer, {
      message: `${valueLabel}.adminAction.referrer must match ${valueLabel}.referrer`,
      path: ["adminAction", "referrer"],
    });

/**
 * Schema for {@link AggregatedReferrerMetricsRevShareCap}.
 */
export const makeAggregatedReferrerMetricsRevShareCapSchema = (
  valueLabel: string = "AggregatedReferrerMetricsRevShareCap",
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
 * Schema for {@link ReferrerEditionMetricsRankedRevShareCap}.
 */
export const makeReferrerEditionMetricsRankedRevShareCapSchema = (
  valueLabel: string = "ReferrerEditionMetricsRankedRevShareCap",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareCap),
      type: z.literal(ReferrerEditionMetricsTypeIds.Ranked),
      rules: makeReferralProgramRulesRevShareCapSchema(`${valueLabel}.rules`),
      referrer: makeAwardedReferrerMetricsRevShareCapSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareCapSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
      status: makeReferralProgramStatusSchema(`${valueLabel}.status`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    })
    .refine((data) => data.referrer.cappedAward.amount <= data.rules.awardPool.amount, {
      message: `${valueLabel}.referrer.cappedAward must be <= ${valueLabel}.rules.awardPool`,
      path: ["referrer", "cappedAward", "amount"],
    });

/**
 * Schema for {@link ReferrerEditionMetricsUnrankedRevShareCap}.
 */
export const makeReferrerEditionMetricsUnrankedRevShareCapSchema = (
  valueLabel: string = "ReferrerEditionMetricsUnrankedRevShareCap",
) =>
  z
    .object({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareCap),
      type: z.literal(ReferrerEditionMetricsTypeIds.Unranked),
      rules: makeReferralProgramRulesRevShareCapSchema(`${valueLabel}.rules`),
      referrer: makeUnrankedReferrerMetricsRevShareCapSchema(`${valueLabel}.referrer`),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareCapSchema(
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
 * Schema for all {@link ReferrerEditionMetrics} variants of the rev-share-cap award model
 * (both ranked and unranked).
 */
export const makeReferrerEditionMetricsRevShareCapSchema = (
  valueLabel: string = "ReferrerEditionMetricsRevShareCap",
) =>
  z.discriminatedUnion("type", [
    makeReferrerEditionMetricsRankedRevShareCapSchema(valueLabel),
    makeReferrerEditionMetricsUnrankedRevShareCapSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferralProgramEditionSummaryRevShareCap}.
 */
export const makeReferralProgramEditionSummaryRevShareCapSchema = (
  valueLabel: string = "ReferralProgramEditionSummaryRevShareCap",
) =>
  makeBaseReferralProgramEditionSummarySchema(valueLabel)
    .safeExtend({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareCap),
      rules: makeReferralProgramRulesRevShareCapSchema(`${valueLabel}.rules`),
      awardPoolRemaining: makePriceUsdcSchema(`${valueLabel}.awardPoolRemaining`),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    });

/**
 * Schema for {@link ReferrerLeaderboardPageRevShareCap}.
 */
export const makeReferrerLeaderboardPageRevShareCapSchema = (
  valueLabel: string = "ReferrerLeaderboardPageRevShareCap",
) =>
  makeBaseReferrerLeaderboardPageSchema(valueLabel)
    .safeExtend({
      awardModel: z.literal(ReferralProgramAwardModels.RevShareCap),
      rules: makeReferralProgramRulesRevShareCapSchema(`${valueLabel}.rules`),
      referrers: z.array(
        makeAwardedReferrerMetricsRevShareCapSchema(`${valueLabel}.referrers[record]`),
      ),
      aggregatedMetrics: makeAggregatedReferrerMetricsRevShareCapSchema(
        `${valueLabel}.aggregatedMetrics`,
      ),
    })
    .refine((data) => data.awardModel === data.rules.awardModel, {
      message: `${valueLabel}.awardModel must equal ${valueLabel}.rules.awardModel`,
      path: ["awardModel"],
    })
    .superRefine((data, ctx) => {
      data.referrers.forEach((referrer, index) => {
        if (referrer.cappedAward.amount > data.rules.awardPool.amount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${valueLabel}.referrers[${index}].cappedAward must be <= ${valueLabel}.rules.awardPool`,
            path: ["referrers", index, "cappedAward", "amount"],
          });
        }
      });
    });
