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
  makeReferralProgramRulesPieSplitSchema,
  makeReferrerEditionMetricsPieSplitSchema,
  makeReferrerLeaderboardPagePieSplitSchema,
} from "../award-models/pie-split/api/zod-schemas";
import {
  makeReferralProgramRulesRevShareLimitSchema,
  makeReferrerEditionMetricsRevShareLimitSchema,
  makeReferrerLeaderboardPageRevShareLimitSchema,
} from "../award-models/rev-share-limit/api/zod-schemas";
import { makeBaseReferralProgramRulesSchema } from "../award-models/shared/api/zod-schemas";
import type { ReferralProgramRulesUnrecognized } from "../award-models/shared/rules";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import type { ReferralProgramEditionConfig } from "../edition";
import {
  MAX_EDITIONS_PER_REQUEST,
  ReferralProgramEditionConfigSetResponseCodes,
  ReferrerLeaderboardPageResponseCodes,
  ReferrerMetricsEditionsResponseCodes,
} from "./types";

/**
 * Schema for {@link ReferralProgramRules}.
 */
export const makeReferralProgramRulesSchema = (valueLabel: string = "ReferralProgramRules") =>
  z.discriminatedUnion("awardModel", [
    makeReferralProgramRulesPieSplitSchema(valueLabel),
    makeReferralProgramRulesRevShareLimitSchema(valueLabel),
  ]);

/**
 * Schema for {@link ReferrerLeaderboardPage}.
 */
export const makeReferrerLeaderboardPageSchema = (valueLabel: string = "ReferrerLeaderboardPage") =>
  z.discriminatedUnion("awardModel", [
    makeReferrerLeaderboardPagePieSplitSchema(valueLabel),
    makeReferrerLeaderboardPageRevShareLimitSchema(valueLabel),
  ]);

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
 * Schema for {@link ReferrerEditionMetrics} (discriminated union of all ranked and unranked model variants).
 */
export const makeReferrerEditionMetricsSchema = (valueLabel: string = "ReferrerEditionMetrics") =>
  z.discriminatedUnion("awardModel", [
    makeReferrerEditionMetricsPieSplitSchema(valueLabel),
    makeReferrerEditionMetricsRevShareLimitSchema(valueLabel),
  ]);

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
 * The list must not be empty after processing all items. Duplicate slugs are not allowed.
 *
 * Two-pass approach:
 *  1. Each item is loosely parsed (based on `rules.awardModel` field).
 *     - Known award models are fully validated with {@link makeReferralProgramEditionConfigSchema}.
 *     - Unknown award models are parsed with {@link makeBaseReferralProgramRulesSchema} and wrapped as
 *       `ReferralProgramRulesUnrecognized`.
 *  2. After processing all items, the result must be non-empty and have no duplicate slugs.
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

    if (result.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: `${valueLabel} must contain at least one edition`,
      });
      // Issue above causes the overall parse to fail; this value is never used.
      return [];
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
 * Schema for {@link ReferralProgramEditionConfigSetData}.
 */
export const makeReferralProgramEditionConfigSetDataSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetData",
) =>
  z.object({
    editions: makeReferralProgramEditionConfigSetArraySchema(`${valueLabel}.editions`),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponseOk}.
 */
export const makeReferralProgramEditionConfigSetResponseOkSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetResponseOk",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionConfigSetResponseCodes.Ok),
    data: makeReferralProgramEditionConfigSetDataSchema(`${valueLabel}.data`),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponseError}.
 */
export const makeReferralProgramEditionConfigSetResponseErrorSchema = (
  _valueLabel: string = "ReferralProgramEditionConfigSetResponseError",
) =>
  z.object({
    responseCode: z.literal(ReferralProgramEditionConfigSetResponseCodes.Error),
    error: z.string(),
    errorMessage: z.string(),
  });

/**
 * Schema for {@link ReferralProgramEditionConfigSetResponse}.
 */
export const makeReferralProgramEditionConfigSetResponseSchema = (
  valueLabel: string = "ReferralProgramEditionConfigSetResponse",
) =>
  z.discriminatedUnion("responseCode", [
    makeReferralProgramEditionConfigSetResponseOkSchema(valueLabel),
    makeReferralProgramEditionConfigSetResponseErrorSchema(valueLabel),
  ]);
