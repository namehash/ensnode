import config from "@/config";

import {
  getReferrerDetail,
  getReferrerLeaderboardPage,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
  type ReferralProgramCycleId,
  type ReferrerDetailAllCyclesData,
  type ReferrerDetailAllCyclesResponse,
  ReferrerDetailAllCyclesResponseCodes,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  serializeReferrerDetailAllCyclesResponse,
  serializeReferrerLeaderboardPageResponse,
} from "@namehash/ens-referrals/v1";
import { makeReferralProgramCycleIdSchema } from "@namehash/ens-referrals/v1/internal";
import { describeRoute } from "hono-openapi";
import { z } from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referralLeaderboardCyclesCachesMiddleware } from "@/middleware/referral-leaderboard-cycles-caches.middleware";

const logger = makeLogger("ensanalytics-api-v1");

// Get list of configured cycle IDs for validation
const getConfiguredCycleIds = (): ReferralProgramCycleId[] => {
  return Array.from(config.referralProgramCycleSet.keys()) as ReferralProgramCycleId[];
};

/**
 * Query parameters schema for referrer leaderboard page requests.
 * Validates cycle ID, page number, and records per page.
 */
const referrerLeaderboardPageQuerySchema = z.object({
  cycle: makeReferralProgramCycleIdSchema("cycle"),
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

  // Apply referrer leaderboard cache middleware to all routes in this handler
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
          description: "Unknown cycle ID",
        },
        500: {
          description: "Internal server error",
        },
      },
    }),
    validate("query", referrerLeaderboardPageQuerySchema),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referralLeaderboardCyclesCaches === undefined) {
        throw new Error(`Invariant(ensanalytics-api-v1): referralLeaderboardCyclesCachesMiddleware required`);
      }

      try {
        const { cycle, page, recordsPerPage } = c.req.valid("query");

        // Get the specific cycle's cache
        // Note: We validate against the configured cycles, not just predefined IDs,
        // to support custom cycles loaded from CUSTOM_REFERRAL_PROGRAM_CYCLES
        const cycleCache = c.var.referralLeaderboardCyclesCaches.get(cycle);

        if (!cycleCache) {
          const configuredCycles = getConfiguredCycleIds();
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
              error: "Internal Server Error",
              errorMessage: `Failed to load leaderboard for cycle ${cycle}.`,
            } satisfies ReferrerLeaderboardPageResponse),
            500,
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

// Get referrer detail for a specific address across all cycles
app.get(
  "/referral-leaderboard/:referrer",
  describeRoute({
    tags: ["ENSAwards"],
    summary: "Get Referrer Detail for All Cycles (v1)",
    description:
      "Returns detailed information for a specific referrer across all referral program cycles",
    responses: {
      200: {
        description: "Successfully retrieved referrer detail for all cycles",
      },
      500: {
        description: "Internal server error - referrer leaderboard for a cycle failed to load",
      },
    },
  }),
  validate("param", referrerAddressSchema),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.referralLeaderboardCyclesCaches === undefined) {
      throw new Error(`Invariant(ensanalytics-api-v1): referralLeaderboardCyclesCachesMiddleware required`);
    }

    try {
      const { referrer } = c.req.valid("param");
      const allCyclesData = {} as ReferrerDetailAllCyclesData;

      // Check all caches and fail immediately if any cache failed
      for (const [cycleId, cycleCache] of c.var.referralLeaderboardCyclesCaches) {
        const leaderboard = await cycleCache.read();
        if (leaderboard instanceof Error) {
          return c.json(
            serializeReferrerDetailAllCyclesResponse({
              responseCode: ReferrerDetailAllCyclesResponseCodes.Error,
              error: "Internal Server Error",
              errorMessage: `Referrer leaderboard data for cycle ${cycleId} has not been successfully cached yet.`,
            } satisfies ReferrerDetailAllCyclesResponse),
            500,
          );
        }
        allCyclesData[cycleId] = getReferrerDetail(referrer, leaderboard);
      }

      return c.json(
        serializeReferrerDetailAllCyclesResponse({
          responseCode: ReferrerDetailAllCyclesResponseCodes.Ok,
          data: allCyclesData,
        } satisfies ReferrerDetailAllCyclesResponse),
      );
    } catch (error) {
      logger.error({ error }, "Error in /v1/ensanalytics/referral-leaderboard/:referrer endpoint");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing your request";
      return c.json(
        serializeReferrerDetailAllCyclesResponse({
          responseCode: ReferrerDetailAllCyclesResponseCodes.Error,
          error: "Internal server error",
          errorMessage,
        } satisfies ReferrerDetailAllCyclesResponse),
        500,
      );
    }
  },
);

export default app;
