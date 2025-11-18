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
  makeDurationSchema,
  makeLowercaseAddressSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
} from "../shared/zod-schemas";
import {
  ITEMS_PER_PAGE_DEFAULT,
  ITEMS_PER_PAGE_MAX,
  PaginatedAggregatedReferrersResponseCodes,
} from "./types";

/**
 * Schema for AggregatedReferrerMetrics
 */
export const makeAggregatedReferrerMetricsSchema = (
  valueLabel: string = "AggregatedReferrerMetrics",
) =>
  z.object({
    referrer: makeLowercaseAddressSchema(`${valueLabel}.referrer`),
    totalReferrals: makePositiveIntegerSchema(`${valueLabel}.totalReferrals`),
    totalIncrementalDuration: makeDurationSchema(`${valueLabel}.totalIncrementalDuration`),
  });

/**
 * Schema for AggregatedReferrerMetricsContribution
 */
export const makeAggregatedReferrerMetricsContributionSchema = (
  valueLabel: string = "AggregatedReferrerMetricsContribution",
) =>
  makeAggregatedReferrerMetricsSchema(valueLabel).extend({
    totalReferralsContribution: z
      .number({
        error: `${valueLabel}.totalReferralsContribution must be a number`,
      })
      .min(0, `${valueLabel}.totalReferralsContribution must be >= 0`)
      .max(1, `${valueLabel}.totalReferralsContribution must be <= 1`),
    totalIncrementalDurationContribution: z
      .number({
        error: `${valueLabel}.totalIncrementalDurationContribution must be a number`,
      })
      .min(0, `${valueLabel}.totalIncrementalDurationContribution must be >= 0`)
      .max(1, `${valueLabel}.totalIncrementalDurationContribution must be <= 1`),
  });

/**
 * Schema for PaginationParams
 */
export const makePaginationParamsSchema = (valueLabel: string = "PaginationParams") =>
  z.object({
    page: makePositiveIntegerSchema(`${valueLabel}.page`).default(1),
    itemsPerPage: makePositiveIntegerSchema(`${valueLabel}.itemsPerPage`)
      .max(ITEMS_PER_PAGE_MAX, `${valueLabel}.itemsPerPage must not exceed ${ITEMS_PER_PAGE_MAX}`)
      .default(ITEMS_PER_PAGE_DEFAULT),
  });

/**
 * Schema for PaginatedAggregatedReferrers
 */
export const makePaginatedAggregatedReferrersSchema = (
  valueLabel: string = "PaginatedAggregatedReferrers",
) =>
  z
    .object({
      referrers: z.array(
        makeAggregatedReferrerMetricsContributionSchema(`${valueLabel}.referrers[item]`),
      ),
      total: makeNonNegativeIntegerSchema(`${valueLabel}.total`),
      paginationParams: makePaginationParamsSchema(`${valueLabel}.paginationParams`),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
      updatedAt: makeUnixTimestampSchema(`${valueLabel}.updatedAt`),
    })
    .check((ctx) => {
      const { paginationParams, hasNext, hasPrev, total } = ctx.value;

      // Validate hasPrev
      const expectedHasPrev = paginationParams.page > 1;
      if (hasPrev !== expectedHasPrev) {
        ctx.issues.push({
          code: "custom",
          message: `${valueLabel}.hasPrev must be ${expectedHasPrev} when page is ${paginationParams.page}`,
          input: ctx.value,
        });
      }

      // Validate hasNext
      const endIndex = paginationParams.page * paginationParams.itemsPerPage;
      const expectedHasNext = endIndex < total;
      if (hasNext !== expectedHasNext) {
        ctx.issues.push({
          code: "custom",
          message: `${valueLabel}.hasNext must be ${expectedHasNext} when page=${paginationParams.page}, itemsPerPage=${paginationParams.itemsPerPage}, total=${total}`,
          input: ctx.value,
        });
      }
    });

/**
 * Schema for {@link PaginatedAggregatedReferrersResponseOk}
 */
export const makePaginatedAggregatedReferrersResponseOkSchema = (
  valueLabel: string = "PaginatedAggregatedReferrersResponse",
) =>
  z.object({
    responseCode: z.literal(PaginatedAggregatedReferrersResponseCodes.Ok),
    data: makePaginatedAggregatedReferrersSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link PaginatedAggregatedReferrersResponseError}
 */
export const makePaginatedAggregatedReferrersResponseErrorSchema = (
  _valueLabel: string = "PaginatedAggregatedReferrersResponse",
) =>
  z.object({
    responseCode: z.literal(PaginatedAggregatedReferrersResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link PaginatedAggregatedReferrersResponse}
 */
export const makePaginatedAggregatedReferrersResponseSchema = (
  valueLabel: string = "PaginatedAggregatedReferrersResponse",
) =>
  z.union([
    makePaginatedAggregatedReferrersResponseOkSchema(valueLabel),
    makePaginatedAggregatedReferrersResponseErrorSchema(valueLabel),
  ]);
