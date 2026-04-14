/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */

import z from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import {
  makeReferralProgramEditionSummaryPieSplitSchema,
  makeReferralProgramRulesPieSplitSchema,
  makeReferrerEditionMetricsPieSplitSchema,
  makeReferrerLeaderboardPagePieSplitSchema,
} from "../award-models/pie-split/api/zod-schemas";
import {
  makeReferralProgramEditionSummaryRevShareCapSchema,
  makeReferralProgramRulesRevShareCapSchema,
  makeReferrerEditionMetricsRevShareCapSchema,
  makeReferrerLeaderboardPageRevShareCapSchema,
} from "../award-models/rev-share-cap/api/zod-schemas";
import {
  makeBaseReferralProgramEditionSummarySchema,
  makeBaseReferralProgramRulesSchema,
  makeBaseReferrerLeaderboardPageSchema,
} from "../award-models/shared/api/zod-schemas";
import type { ReferrerEditionMetricsUnrecognized } from "../award-models/shared/edition-metrics";
import type { ReferralProgramEditionSummaryUnrecognized } from "../award-models/shared/edition-summary";
import type { ReferrerLeaderboardPageUnrecognized } from "../award-models/shared/leaderboard-page";
import type { ReferralProgramRulesUnrecognized } from "../award-models/shared/rules";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import type { ReferralProgramEditionConfig } from "../edition";
import type { ReferrerEditionMetrics } from "../edition-metrics";
import type { ReferralProgramEditionSummary } from "../edition-summary";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import {
  MAX_EDITIONS_PER_REQUEST,
  ReferralProgramEditionSummariesResponseCodes,
  ReferrerLeaderboardPageResponseCodes,
  ReferrerMetricsEditionsResponseCodes,
} from "./types";

/**
 * Schema for {@link ReferralProgramRules}
 */
export const makeReferralProgramRulesSchema = (valueLabel: string = "ReferralProgramRules") =>
  z.discriminatedUnion("awardModel", [
    makeReferralProgramRulesPieSplitSchema(valueLabel),
    makeReferralProgramRulesRevShareCapSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferrerLeaderboardPage}.
 *
 * Forward-compatible — peeks at `awardModel` before committing to full validation:
 * - Known award models are fully validated with the model-specific schema.
 * - Unknown award models are wrapped as {@link ReferrerLeaderboardPageUnrecognized}.
 */
export const makeReferrerLeaderboardPageSchema = (
  valueLabel: string = "ReferrerLeaderboardPage",
) => {
  const knownAwardModels = Object.values(ReferralProgramAwardModels).filter(
    (m) => m !== ReferralProgramAwardModels.Unrecognized,
  ) as string[];

  // Loose schema used only to peek at awardModel before full validation.
  const looseSchema = z.object({ awardModel: z.string() }).passthrough();

  // Schema for known award models — dispatch is handled automatically by discriminatedUnion.
  const knownSchema = z.discriminatedUnion("awardModel", [
    makeReferrerLeaderboardPagePieSplitSchema(valueLabel),
    makeReferrerLeaderboardPageRevShareCapSchema(valueLabel),
  ]);

  // Base schema for fields present on all leaderboard page variants (used for Unrecognized).
  const baseSchema = makeBaseReferrerLeaderboardPageSchema(valueLabel);

  return looseSchema.transform((data, ctx): ReferrerLeaderboardPage => {
    if (knownAwardModels.includes(data.awardModel)) {
      const parsed = knownSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: issue.path as PropertyKey[],
            message: issue.message,
          });
        }
        return z.NEVER;
      }
      return parsed.data;
    }

    // Unknown awardModel — preserve as ReferrerLeaderboardPageUnrecognized using base fields.
    const parsed = baseSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: issue.path as PropertyKey[],
          message: issue.message,
        });
      }
      return z.NEVER;
    }
    return {
      ...parsed.data,
      awardModel: ReferralProgramAwardModels.Unrecognized,
      originalAwardModel: data.awardModel,
    } satisfies ReferrerLeaderboardPageUnrecognized;
  });
};

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
 * Schema for {@link ReferrerEditionMetrics} (all ranked and unranked model variants, plus Unrecognized).
 *
 * Forward-compatible — peeks at `awardModel` before committing to full validation:
 * - Known award models are fully validated with the model-specific schema.
 * - Unknown award models are wrapped as {@link ReferrerEditionMetricsUnrecognized}.
 */
export const makeReferrerEditionMetricsSchema = (valueLabel: string = "ReferrerEditionMetrics") => {
  const knownAwardModels = Object.values(ReferralProgramAwardModels).filter(
    (m) => m !== ReferralProgramAwardModels.Unrecognized,
  ) as string[];

  // Loose schema used only to peek at awardModel before full validation.
  const looseSchema = z.object({ awardModel: z.string() }).passthrough();

  // Schema for known award models — dispatch is handled automatically by discriminatedUnion.
  const knownSchema = z.discriminatedUnion("awardModel", [
    makeReferrerEditionMetricsPieSplitSchema(valueLabel),
    makeReferrerEditionMetricsRevShareCapSchema(valueLabel),
  ]);

  return looseSchema.transform((data, ctx): ReferrerEditionMetrics => {
    if (knownAwardModels.includes(data.awardModel)) {
      const parsed = knownSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: issue.path as PropertyKey[],
            message: issue.message,
          });
        }
        return z.NEVER;
      }
      return parsed.data;
    }

    // Unknown awardModel — wrap as ReferrerEditionMetricsUnrecognized.
    // No base fields are extracted here (unlike ReferrerLeaderboardPageUnrecognized) because
    // callers are expected to skip unrecognized edition metrics entirely rather than inspect them.
    return {
      awardModel: ReferralProgramAwardModels.Unrecognized,
      originalAwardModel: data.awardModel,
    } satisfies ReferrerEditionMetricsUnrecognized;
  });
};

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
 * Schema for the shared base fields of a {@link ReferralProgramEditionConfig}.
 */
const makeReferralProgramEditionConfigBaseSchema = (valueLabel: string) =>
  z.object({
    slug: makeReferralProgramEditionSlugSchema(`${valueLabel}.slug`),
    displayName: z.string().min(1, `${valueLabel}.displayName must not be empty`),
    rules: makeBaseReferralProgramRulesSchema(`${valueLabel}.rules`),
  });

/**
 * Schema for validating a {@link ReferralProgramEditionConfig}.
 */
export const makeReferralProgramEditionConfigSchema = (
  valueLabel: string = "ReferralProgramEditionConfig",
) =>
  makeReferralProgramEditionConfigBaseSchema(valueLabel).safeExtend({
    rules: makeReferralProgramRulesSchema(`${valueLabel}.rules`),
  });

/**
 * Schema for validating referral program edition config set array.
 *
 * Editions whose `rules.awardModel` is not recognized by this client version are preserved as
 * {@link ReferralProgramRulesUnrecognized} for forward compatibility — nothing is silently dropped.
 * Downstream code (e.g., leaderboard cache setup) is responsible for skipping unrecognized
 * editions with a warning log rather than crashing.
 *
 * The list may be empty. Duplicate slugs are not allowed.
 *
 * Two-pass approach:
 *  1. Each item is loosely parsed (based on `rules.awardModel` field).
 *     - Known award models are fully validated with {@link makeReferralProgramEditionConfigSchema}.
 *     - Unknown award models are parsed with {@link makeBaseReferralProgramRulesSchema} and wrapped as
 *       `ReferralProgramRulesUnrecognized`.
 *  2. After processing all items, the result must have no duplicate slugs.
 */
export const makeReferralProgramEditionConfigSetArraySchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetArray",
) => {
  const knownAwardModels = Object.values(ReferralProgramAwardModels).filter(
    (m) => m !== ReferralProgramAwardModels.Unrecognized,
  ) as string[];
  const configSchema = makeReferralProgramEditionConfigSchema(`${valueLabel}[edition]`);

  // Loose schema used only to peek at rules.awardModel before full validation.
  const looseItemSchema = z
    .object({ rules: z.object({ awardModel: z.string() }).passthrough() })
    .passthrough();

  // Schema for extracting base fields from an unrecognized edition.
  const unrecognizedBaseSchema = makeReferralProgramEditionConfigBaseSchema(
    `${valueLabel}[edition]`,
  );

  return z.array(looseItemSchema).transform((items, ctx): ReferralProgramEditionConfig[] => {
    const result: ReferralProgramEditionConfig[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (knownAwardModels.includes(item.rules.awardModel)) {
        // Known award model — fully validate.
        const parsed = configSchema.safeParse(item);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            ctx.addIssue({
              code: "custom",
              path: [i, ...(issue.path as PropertyKey[])],
              message: issue.message,
            });
          }
        } else {
          result.push(parsed.data);
        }
      } else {
        // Unknown award model — preserve as ReferralProgramRulesUnrecognized using base fields.
        const parsed = unrecognizedBaseSchema.safeParse(item);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            ctx.addIssue({
              code: "custom",
              path: [i, ...(issue.path as PropertyKey[])],
              message: issue.message,
            });
          }
          continue;
        }

        result.push({
          ...parsed.data,
          rules: {
            ...parsed.data.rules,
            awardModel: ReferralProgramAwardModels.Unrecognized,
            originalAwardModel: item.rules.awardModel,
          } satisfies ReferralProgramRulesUnrecognized,
        });
      }
    }

    const slugs = new Set<string>();
    for (const edition of result) {
      if (slugs.has(edition.slug)) {
        ctx.addIssue({
          code: "custom",
          message: `${valueLabel} must not contain duplicate edition slugs`,
        });
        // Issue above causes the overall parse to fail; this value is never used.
        return [];
      }
      slugs.add(edition.slug);
    }

    return result;
  });
};

/**
 * Schema for {@link ReferralProgramEditionSummary}.
 *
 * Forward-compatible — peeks at `awardModel` before committing to full validation:
 * - Known award models are fully validated with the model-specific schema.
 * - Unknown award models are wrapped as {@link ReferralProgramEditionSummaryUnrecognized}.
 */
export const makeReferralProgramEditionSummarySchema = (
  valueLabel: string = "ReferralProgramEditionSummary",
) => {
  const knownAwardModels = Object.values(ReferralProgramAwardModels).filter(
    (m) => m !== ReferralProgramAwardModels.Unrecognized,
  ) as string[];

  // Loose schema used only to peek at awardModel before full validation.
  const looseSchema = z.object({ awardModel: z.string() }).passthrough();

  // Schema for known award models — dispatch handled automatically by discriminatedUnion.
  const knownSchema = z.discriminatedUnion("awardModel", [
    makeReferralProgramEditionSummaryPieSplitSchema(valueLabel),
    makeReferralProgramEditionSummaryRevShareCapSchema(valueLabel),
  ]);

  // Base schema for fields present on all edition summary variants (used for Unrecognized).
  const baseSchema = makeBaseReferralProgramEditionSummarySchema(valueLabel);

  return looseSchema.transform((data, ctx): ReferralProgramEditionSummary => {
    if (knownAwardModels.includes(data.awardModel)) {
      const parsed = knownSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: issue.path as PropertyKey[],
            message: issue.message,
          });
        }
        return z.NEVER;
      }
      return parsed.data;
    }

    // Unknown awardModel — preserve as ReferralProgramEditionSummaryUnrecognized using base fields.
    const parsed = baseSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: issue.path as PropertyKey[],
          message: issue.message,
        });
      }
      return z.NEVER;
    }
    return {
      ...parsed.data,
      awardModel: ReferralProgramAwardModels.Unrecognized,
      rules: {
        ...parsed.data.rules,
        awardModel: ReferralProgramAwardModels.Unrecognized,
        originalAwardModel: data.awardModel,
      },
    } satisfies ReferralProgramEditionSummaryUnrecognized;
  });
};

/**
 * Schema for {@link ReferralProgramEditionSummariesData}.
 */
export const makeReferralProgramEditionSummariesDataSchema = (
  valueLabel: string = "ReferralProgramEditionSummariesData",
) =>
  z.object({
    editions: z.array(makeReferralProgramEditionSummarySchema(`${valueLabel}.editions[edition]`)),
  });

/**
 * Schema for {@link ReferralProgramEditionSummariesResponseOk}.
 */
export const makeReferralProgramEditionSummariesResponseOkSchema = (
  valueLabel: string = "ReferralProgramEditionSummariesResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionSummariesResponseCodes.Ok),
    data: makeReferralProgramEditionSummariesDataSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link ReferralProgramEditionSummariesResponseError}.
 */
export const makeReferralProgramEditionSummariesResponseErrorSchema = (
  _valueLabel: string = "ReferralProgramEditionSummariesResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionSummariesResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferralProgramEditionSummariesResponse}.
 */
export const makeReferralProgramEditionSummariesResponseSchema = (
  valueLabel: string = "ReferralProgramEditionSummariesResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferralProgramEditionSummariesResponseOkSchema(valueLabel),
    makeReferralProgramEditionSummariesResponseErrorSchema(valueLabel),
  ]);
