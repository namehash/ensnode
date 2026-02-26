import z from "zod/v4";

import {
  makeAccountIdSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
  makeUrlSchema,
} from "@ensnode/ensnode-sdk/internal";

import { ReferralProgramStatuses } from "../../../status";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "../leaderboard-page";

/**
 * Schema for {@link BaseReferralProgramRules}.
 */
export const makeBaseReferralProgramRulesSchema = (valueLabel: string) =>
  z
    .object({
      awardModel: z.string(),
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
 * Validates that the status is one of: "Scheduled", "Active", or "Closed".
 */
export const makeReferralProgramStatusSchema = (_valueLabel: string = "status") =>
  z.enum(ReferralProgramStatuses);
