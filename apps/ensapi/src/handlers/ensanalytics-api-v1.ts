import {
  getReferrerEditionMetrics,
  getReferrerLeaderboardPage,
  MAX_EDITIONS_PER_REQUEST,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
  type ReferralProgramEditionConfigSetResponse,
  ReferralProgramEditionConfigSetResponseCodes,
  type ReferralProgramEditionSlug,
  type ReferrerLeaderboard,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerMetricsEditionsData,
  type ReferrerMetricsEditionsResponse,
  ReferrerMetricsEditionsResponseCodes,
  serializeReferralProgramEditionConfigSetResponse,
  serializeReferrerLeaderboardPageResponse,
  serializeReferrerMetricsEditionsResponse,
} from "@namehash/ens-referrals/v1";
import {
  makeReferralProgramEditionSlugSchema,
  makeReferrerMetricsEditionsArraySchema,
} from "@namehash/ens-referrals/v1/internal";
import { describeRoute } from "hono-openapi";
import { z } from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referralLeaderboardEditionsCachesMiddleware } from "@/middleware/referral-leaderboard-editions-caches.middleware";
import { referralProgramEditionConfigSetMiddleware } from "@/middleware/referral-program-edition-set.middleware";

const logger = makeLogger("ensanalytics-api-v1");

/**
 * Query parameters schema for referrer leaderboard page requests.
 * Validates edition slug, page number, and records per page.
 */
const referrerLeaderboardPageQuerySchema = z.object({
  edition: makeReferralProgramEditionSlugSchema("edition"),
  page: z
    .optional(z.coerce.number().int().min(1, "Page must be a positive integer"))
    .describe("Page number for pagination"),
  recordsPerPage: z
    .optional(
      z.coerce
        .number()
        .int()
        .min(1, "Records per page must be at least 1")
        .max(
          REFERRERS_PER_LEADERBOARD_PAGE_MAX,
          `Records per page must not exceed ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}`,
        ),
    )
    .describe("Number of referrers per page"),
}) satisfies z.ZodType<ReferrerLeaderboardPageRequest>;

const app = factory
  .createApp()

  // Apply referral program edition config set middleware
  .use(referralProgramEditionConfigSetMiddleware)

  // Apply referrer leaderboard cache middleware (depends on edition config set middleware)
  .use(referralLeaderboardEditionsCachesMiddleware)

  // Get a page from the referrer leaderboard for a specific edition
  .get(
    "/referral-leaderboard",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Referrer Leaderboard (v1)",
      description: "Returns a paginated page from the referrer leaderboard for a specific edition",
      responses: {
        200: {
          description: "Successfully retrieved referrer leaderboard page",
        },
        404: {
          description: "Unknown edition slug",
        },
        500: {
          description: "Internal server error",
        },
        503: {
          description: "Service unavailable",
        },
      },
    }),
    validate("query", referrerLeaderboardPageQuerySchema),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referralLeaderboardEditionsCaches === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralLeaderboardEditionsCachesMiddleware required`,
        );
      }

      try {
        const { edition, page, recordsPerPage } = c.req.valid("query");

        // Check if edition set failed to load
        if (c.var.referralLeaderboardEditionsCaches instanceof Error) {
          logger.error(
            { error: c.var.referralLeaderboardEditionsCaches },
            "Referral program edition set failed to load",
          );
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: "Referral program configuration is currently unavailable.",
            } satisfies ReferrerLeaderboardPageResponse),
            503,
          );
        }

        // Get the specific edition's cache
        const editionCache = c.var.referralLeaderboardEditionsCaches.get(edition);

        if (!editionCache) {
          const configuredEditions = Array.from(c.var.referralLeaderboardEditionsCaches.keys());
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Not Found",
              errorMessage: `Unknown edition: ${edition}. Valid editions: ${configuredEditions.join(", ")}`,
            } satisfies ReferrerLeaderboardPageResponse),
            404,
          );
        }

        // Read from the edition's cache
        const leaderboard = await editionCache.read();

        // Check if this specific edition failed to build
        if (leaderboard instanceof Error) {
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: `Failed to load leaderboard for edition ${edition}.`,
            } satisfies ReferrerLeaderboardPageResponse),
            503,
          );
        }

        const leaderboardPage = getReferrerLeaderboardPage({ page, recordsPerPage }, leaderboard);

        return c.json(
          serializeReferrerLeaderboardPageResponse({
            responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
            data: leaderboardPage,
          } satisfies ReferrerLeaderboardPageResponse),
        );
      } catch (error) {
        logger.error({ error }, "Error in /v1/ensanalytics/referral-leaderboard endpoint");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while processing your request";
        return c.json(
          serializeReferrerLeaderboardPageResponse({
            responseCode: ReferrerLeaderboardPageResponseCodes.Error,
            error: "Internal server error",
            errorMessage,
          } satisfies ReferrerLeaderboardPageResponse),
          500,
        );
      }
    },
  );

// Referrer address parameter schema
const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address").describe("Referrer Ethereum address"),
});

// Editions query parameter schema
const editionsQuerySchema = z.object({
  editions: z
    .string()
    .describe("Comma-separated list of edition slugs")
    .transform((value) => value.split(",").map((s) => s.trim()))
    .pipe(makeReferrerMetricsEditionsArraySchema("editions")),
});

// Get referrer detail for a specific address for requested editions
app
  .get(
    "/referrer/:referrer",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Referrer Detail for Editions (v1)",
      description: `Returns detailed information for a specific referrer for the requested editions. Requires 1-${MAX_EDITIONS_PER_REQUEST} distinct edition slugs. All requested editions must be recognized and have cached data, or the request fails.`,
      responses: {
        200: {
          description: "Successfully retrieved referrer detail for requested editions",
        },
        400: {
          description: "Invalid request",
        },
        404: {
          description: "Unknown edition slug",
        },
        500: {
          description: "Internal server error",
        },
        503: {
          description: "Service unavailable",
        },
      },
    }),
    validate("param", referrerAddressSchema),
    validate("query", editionsQuerySchema),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referralLeaderboardEditionsCaches === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralLeaderboardEditionsCachesMiddleware required`,
        );
      }

      try {
        const { referrer } = c.req.valid("param");
        const { editions } = c.req.valid("query");

        // Check if edition set failed to load
        if (c.var.referralLeaderboardEditionsCaches instanceof Error) {
          logger.error(
            { error: c.var.referralLeaderboardEditionsCaches },
            "Referral program edition set failed to load",
          );
          return c.json(
            serializeReferrerMetricsEditionsResponse({
              responseCode: ReferrerMetricsEditionsResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: "Referral program configuration is currently unavailable.",
            } satisfies ReferrerMetricsEditionsResponse),
            503,
          );
        }

        // Type narrowing: at this point we know it's not an Error
        const editionsCaches = c.var.referralLeaderboardEditionsCaches;

        // Validate that all requested editions are recognized (exist in the cache map)
        const configuredEditions = Array.from(editionsCaches.keys());
        const unrecognizedEditions = editions.filter((edition) => !editionsCaches.has(edition));

        if (unrecognizedEditions.length > 0) {
          return c.json(
            serializeReferrerMetricsEditionsResponse({
              responseCode: ReferrerMetricsEditionsResponseCodes.Error,
              error: "Not Found",
              errorMessage: `Unknown edition(s): ${unrecognizedEditions.join(", ")}. Valid editions: ${configuredEditions.join(", ")}`,
            } satisfies ReferrerMetricsEditionsResponse),
            404,
          );
        }

        // Read all requested edition caches
        const editionLeaderboards = await Promise.all(
          editions.map(async (editionSlug) => {
            const editionCache = editionsCaches.get(editionSlug);
            if (!editionCache) {
              throw new Error(`Invariant: edition cache for ${editionSlug} should exist`);
            }
            const leaderboard = await editionCache.read();
            return { editionSlug, leaderboard };
          }),
        );

        // Validate that all requested editions have cached data (no errors)
        const uncachedEditions = editionLeaderboards
          .filter(({ leaderboard }) => leaderboard instanceof Error)
          .map(({ editionSlug }) => editionSlug);

        if (uncachedEditions.length > 0) {
          return c.json(
            serializeReferrerMetricsEditionsResponse({
              responseCode: ReferrerMetricsEditionsResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: `Referrer leaderboard data not cached for edition(s): ${uncachedEditions.join(", ")}`,
            } satisfies ReferrerMetricsEditionsResponse),
            503,
          );
        }

        // Type narrowing: at this point all leaderboards are guaranteed to be non-Error
        const validEditionLeaderboards = editionLeaderboards.filter(
          (
            item,
          ): item is {
            editionSlug: ReferralProgramEditionSlug;
            leaderboard: ReferrerLeaderboard;
          } => !(item.leaderboard instanceof Error),
        );

        // Build response data for the requested editions
        const editionsData = Object.fromEntries(
          validEditionLeaderboards.map(({ editionSlug, leaderboard }) => [
            editionSlug,
            getReferrerEditionMetrics(referrer, leaderboard),
          ]),
        ) as ReferrerMetricsEditionsData;

        return c.json(
          serializeReferrerMetricsEditionsResponse({
            responseCode: ReferrerMetricsEditionsResponseCodes.Ok,
            data: editionsData,
          } satisfies ReferrerMetricsEditionsResponse),
        );
      } catch (error) {
        logger.error(
          { error },
          "Error in /v1/ensanalytics/referral-leaderboard/:referrer endpoint",
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while processing your request";
        return c.json(
          serializeReferrerMetricsEditionsResponse({
            responseCode: ReferrerMetricsEditionsResponseCodes.Error,
            error: "Internal server error",
            errorMessage,
          } satisfies ReferrerMetricsEditionsResponse),
          500,
        );
      }
    },
  )

  // Get configured edition config set
  .get(
    "/editions",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Edition Config Set (v1)",
      description:
        "Returns the currently configured referral program edition config set. Editions are sorted in descending order by start timestamp (most recent first).",
      responses: {
        200: {
          description: "Successfully retrieved edition config set",
        },
        500: {
          description: "Internal server error",
        },
        503: {
          description: "Service unavailable",
        },
      },
    }),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referralProgramEditionConfigSet === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralProgramEditionConfigSetMiddleware required`,
        );
      }

      try {
        // Check if edition config set failed to load
        if (c.var.referralProgramEditionConfigSet instanceof Error) {
          logger.error(
            { error: c.var.referralProgramEditionConfigSet },
            "Referral program edition config set failed to load",
          );
          return c.json(
            serializeReferralProgramEditionConfigSetResponse({
              responseCode: ReferralProgramEditionConfigSetResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: "Referral program configuration is currently unavailable.",
            } satisfies ReferralProgramEditionConfigSetResponse),
            503,
          );
        }

        // Convert Map to array and sort by start timestamp descending
        const editions = Array.from(c.var.referralProgramEditionConfigSet.values()).sort(
          (a, b) => b.rules.startTime - a.rules.startTime,
        );

        return c.json(
          serializeReferralProgramEditionConfigSetResponse({
            responseCode: ReferralProgramEditionConfigSetResponseCodes.Ok,
            data: {
              editions,
            },
          } satisfies ReferralProgramEditionConfigSetResponse),
        );
      } catch (error) {
        logger.error({ error }, "Error in /v1/ensanalytics/editions endpoint");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while processing your request";
        return c.json(
          serializeReferralProgramEditionConfigSetResponse({
            responseCode: ReferralProgramEditionConfigSetResponseCodes.Error,
            error: "Internal server error",
            errorMessage,
          } satisfies ReferralProgramEditionConfigSetResponse),
          500,
        );
      }
    },
  );

export default app;
