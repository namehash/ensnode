import {
  getReferrerDetail,
  getReferrerLeaderboardPage,
  MAX_CYCLES_PER_REQUEST,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
  type ReferralProgramCycleConfigSetResponse,
  ReferralProgramCycleConfigSetResponseCodes,
  type ReferralProgramCycleSlug,
  type ReferrerDetailCyclesData,
  type ReferrerDetailCyclesResponse,
  ReferrerDetailCyclesResponseCodes,
  type ReferrerLeaderboard,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  serializeReferralProgramCycleConfigSetResponse,
  serializeReferrerDetailCyclesResponse,
  serializeReferrerLeaderboardPageResponse,
} from "@namehash/ens-referrals/v1";
import {
  makeReferralProgramCycleSlugSchema,
  makeReferrerDetailCyclesArraySchema,
} from "@namehash/ens-referrals/v1/internal";
import { describeRoute } from "hono-openapi";
import { z } from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referralLeaderboardCyclesCachesMiddleware } from "@/middleware/referral-leaderboard-cycles-caches.middleware";
import { referralProgramCycleConfigSetMiddleware } from "@/middleware/referral-program-cycle-set.middleware";

const logger = makeLogger("ensanalytics-api-v1");

/**
 * Query parameters schema for referrer leaderboard page requests.
 * Validates cycle slug, page number, and records per page.
 */
const referrerLeaderboardPageQuerySchema = z.object({
  cycle: makeReferralProgramCycleSlugSchema("cycle"),
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

  // Apply referral program cycle config set middleware
  .use(referralProgramCycleConfigSetMiddleware)

  // Apply referrer leaderboard cache middleware (depends on cycle config set middleware)
  .use(referralLeaderboardCyclesCachesMiddleware)

  // Get a page from the referrer leaderboard for a specific cycle
  .get(
    "/referral-leaderboard",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Referrer Leaderboard (v1)",
      description: "Returns a paginated page from the referrer leaderboard for a specific cycle",
      responses: {
        200: {
          description: "Successfully retrieved referrer leaderboard page",
        },
        404: {
          description: "Unknown cycle slug",
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
      if (c.var.referralLeaderboardCyclesCaches === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralLeaderboardCyclesCachesMiddleware required`,
        );
      }

      try {
        const { cycle, page, recordsPerPage } = c.req.valid("query");

        // Check if cycle set failed to load
        if (c.var.referralLeaderboardCyclesCaches instanceof Error) {
          logger.error(
            { error: c.var.referralLeaderboardCyclesCaches },
            "Referral program cycle set failed to load",
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

        // Get the specific cycle's cache
        const cycleCache = c.var.referralLeaderboardCyclesCaches.get(cycle);

        if (!cycleCache) {
          const configuredCycles = Array.from(c.var.referralLeaderboardCyclesCaches.keys());
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Not Found",
              errorMessage: `Unknown cycle: ${cycle}. Valid cycles: ${configuredCycles.join(", ")}`,
            } satisfies ReferrerLeaderboardPageResponse),
            404,
          );
        }

        // Read from the cycle's cache
        const leaderboard = await cycleCache.read();

        // Check if this specific cycle failed to build
        if (leaderboard instanceof Error) {
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: `Failed to load leaderboard for cycle ${cycle}.`,
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

// Cycles query parameter schema
const cyclesQuerySchema = z.object({
  cycles: z
    .string()
    .describe("Comma-separated list of cycle slugs")
    .transform((value) => value.split(",").map((s) => s.trim()))
    .pipe(makeReferrerDetailCyclesArraySchema("cycles")),
});

// Get referrer detail for a specific address for requested cycles
app
  .get(
    "/referrer/:referrer",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Referrer Detail for Cycles (v1)",
      description: `Returns detailed information for a specific referrer for the requested cycles. Requires 1-${MAX_CYCLES_PER_REQUEST} distinct cycle slugs. All requested cycles must be recognized and have cached data, or the request fails.`,
      responses: {
        200: {
          description: "Successfully retrieved referrer detail for requested cycles",
        },
        400: {
          description: "Invalid request",
        },
        404: {
          description: "Unknown cycle slug",
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
    validate("query", cyclesQuerySchema),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referralLeaderboardCyclesCaches === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralLeaderboardCyclesCachesMiddleware required`,
        );
      }

      try {
        const { referrer } = c.req.valid("param");
        const { cycles } = c.req.valid("query");

        // Check if cycle set failed to load
        if (c.var.referralLeaderboardCyclesCaches instanceof Error) {
          logger.error(
            { error: c.var.referralLeaderboardCyclesCaches },
            "Referral program cycle set failed to load",
          );
          return c.json(
            serializeReferrerDetailCyclesResponse({
              responseCode: ReferrerDetailCyclesResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: "Referral program configuration is currently unavailable.",
            } satisfies ReferrerDetailCyclesResponse),
            503,
          );
        }

        // Type narrowing: at this point we know it's not an Error
        const cyclesCaches = c.var.referralLeaderboardCyclesCaches;

        // Validate that all requested cycles are recognized (exist in the cache map)
        const configuredCycles = Array.from(cyclesCaches.keys());
        const unrecognizedCycles = cycles.filter((cycle) => !cyclesCaches.has(cycle));

        if (unrecognizedCycles.length > 0) {
          return c.json(
            serializeReferrerDetailCyclesResponse({
              responseCode: ReferrerDetailCyclesResponseCodes.Error,
              error: "Not Found",
              errorMessage: `Unknown cycle(s): ${unrecognizedCycles.join(", ")}. Valid cycles: ${configuredCycles.join(", ")}`,
            } satisfies ReferrerDetailCyclesResponse),
            404,
          );
        }

        // Read all requested cycle caches
        const cycleLeaderboards = await Promise.all(
          cycles.map(async (cycleSlug) => {
            const cycleCache = cyclesCaches.get(cycleSlug);
            if (!cycleCache) {
              throw new Error(`Invariant: cycle cache for ${cycleSlug} should exist`);
            }
            const leaderboard = await cycleCache.read();
            return { cycleSlug, leaderboard };
          }),
        );

        // Validate that all requested cycles have cached data (no errors)
        const uncachedCycles = cycleLeaderboards
          .filter(({ leaderboard }) => leaderboard instanceof Error)
          .map(({ cycleSlug }) => cycleSlug);

        if (uncachedCycles.length > 0) {
          return c.json(
            serializeReferrerDetailCyclesResponse({
              responseCode: ReferrerDetailCyclesResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: `Referrer leaderboard data not cached for cycle(s): ${uncachedCycles.join(", ")}`,
            } satisfies ReferrerDetailCyclesResponse),
            503,
          );
        }

        // Type narrowing: at this point all leaderboards are guaranteed to be non-Error
        const validCycleLeaderboards = cycleLeaderboards.filter(
          (
            item,
          ): item is { cycleSlug: ReferralProgramCycleSlug; leaderboard: ReferrerLeaderboard } =>
            !(item.leaderboard instanceof Error),
        );

        // Build response data for the requested cycles
        const cyclesData = Object.fromEntries(
          validCycleLeaderboards.map(({ cycleSlug, leaderboard }) => [
            cycleSlug,
            getReferrerDetail(referrer, leaderboard),
          ]),
        ) as ReferrerDetailCyclesData;

        return c.json(
          serializeReferrerDetailCyclesResponse({
            responseCode: ReferrerDetailCyclesResponseCodes.Ok,
            data: cyclesData,
          } satisfies ReferrerDetailCyclesResponse),
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
          serializeReferrerDetailCyclesResponse({
            responseCode: ReferrerDetailCyclesResponseCodes.Error,
            error: "Internal server error",
            errorMessage,
          } satisfies ReferrerDetailCyclesResponse),
          500,
        );
      }
    },
  )

  // Get configured cycle config set
  .get(
    "/cycles",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Cycle Config Set (v1)",
      description:
        "Returns the currently configured referral program cycle config set. Cycles are sorted in descending order by start timestamp (most recent first).",
      responses: {
        200: {
          description: "Successfully retrieved cycle config set",
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
      if (c.var.referralProgramCycleConfigSet === undefined) {
        throw new Error(
          `Invariant(ensanalytics-api-v1): referralProgramCycleConfigSetMiddleware required`,
        );
      }

      try {
        // Check if cycle config set failed to load
        if (c.var.referralProgramCycleConfigSet instanceof Error) {
          logger.error(
            { error: c.var.referralProgramCycleConfigSet },
            "Referral program cycle config set failed to load",
          );
          return c.json(
            serializeReferralProgramCycleConfigSetResponse({
              responseCode: ReferralProgramCycleConfigSetResponseCodes.Error,
              error: "Service Unavailable",
              errorMessage: "Referral program configuration is currently unavailable.",
            } satisfies ReferralProgramCycleConfigSetResponse),
            503,
          );
        }

        // Convert Map to array and sort by start timestamp descending
        const cycles = Array.from(c.var.referralProgramCycleConfigSet.values()).sort(
          (a, b) => b.rules.startTime - a.rules.startTime,
        );

        return c.json(
          serializeReferralProgramCycleConfigSetResponse({
            responseCode: ReferralProgramCycleConfigSetResponseCodes.Ok,
            data: {
              cycles,
            },
          } satisfies ReferralProgramCycleConfigSetResponse),
        );
      } catch (error) {
        logger.error({ error }, "Error in /v1/ensanalytics/cycles endpoint");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while processing your request";
        return c.json(
          serializeReferralProgramCycleConfigSetResponse({
            responseCode: ReferralProgramCycleConfigSetResponseCodes.Error,
            error: "Internal server error",
            errorMessage,
          } satisfies ReferralProgramCycleConfigSetResponse),
          500,
        );
      }
    },
  );

export default app;
