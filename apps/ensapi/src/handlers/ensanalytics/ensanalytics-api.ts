import {
  buildEditionSummary,
  getReferrerEditionMetrics,
  getReferrerLeaderboardPage,
  type ReferralProgramEditionSlug,
  type ReferralProgramEditionSummariesResponse,
  ReferralProgramEditionSummariesResponseCodes,
  type ReferrerLeaderboard,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerMetricsEditionsData,
  type ReferrerMetricsEditionsResponse,
  ReferrerMetricsEditionsResponseCodes,
  serializeReferralProgramEditionSummariesResponse,
  serializeReferrerLeaderboardPageResponse,
  serializeReferrerMetricsEditionsResponse,
} from "@namehash/ens-referrals";

import { createApp } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referralLeaderboardEditionsCachesMiddleware } from "@/middleware/referral-leaderboard-editions-caches.middleware";
import { referralProgramEditionConfigSetMiddleware } from "@/middleware/referral-program-edition-set.middleware";

import {
  getEditionsRoute,
  getReferralLeaderboardRoute,
  getReferrerDetailRoute,
} from "./ensanalytics-api.routes";

const logger = makeLogger("ensanalytics-api");

const app = createApp({
  middlewares: [
    referralProgramEditionConfigSetMiddleware,
    referralLeaderboardEditionsCachesMiddleware,
  ],
});

// Get a page from the referrer leaderboard for a specific edition
app.openapi(getReferralLeaderboardRoute, async (c) => {
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
});

// Get referrer detail for a specific address for requested editions
app.openapi(getReferrerDetailRoute, async (c) => {
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
    logger.error({ error }, "Error in /v1/ensanalytics/referrer/:referrer endpoint");
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
});

// Get edition summaries
app.openapi(getEditionsRoute, async (c) => {
  try {
    // Check if edition config set failed to load
    if (c.var.referralProgramEditionConfigSet instanceof Error) {
      logger.error(
        { error: c.var.referralProgramEditionConfigSet },
        "Referral program edition config set failed to load",
      );
      return c.json(
        serializeReferralProgramEditionSummariesResponse({
          responseCode: ReferralProgramEditionSummariesResponseCodes.Error,
          error: "Service Unavailable",
          errorMessage: "Referral program configuration is currently unavailable.",
        } satisfies ReferralProgramEditionSummariesResponse),
        503,
      );
    }

    // Check if leaderboard caches failed to load
    if (c.var.referralLeaderboardEditionsCaches instanceof Error) {
      logger.error(
        { error: c.var.referralLeaderboardEditionsCaches },
        "Referral program leaderboard caches failed to load",
      );
      return c.json(
        serializeReferralProgramEditionSummariesResponse({
          responseCode: ReferralProgramEditionSummariesResponseCodes.Error,
          error: "Service Unavailable",
          errorMessage: "Referral program leaderboard data is currently unavailable.",
        } satisfies ReferralProgramEditionSummariesResponse),
        503,
      );
    }

    // Sort edition configs by start timestamp descending
    const editionConfigs = Array.from(c.var.referralProgramEditionConfigSet.values()).sort(
      (a, b) => b.rules.startTime - a.rules.startTime,
    );

    // Read all leaderboard caches in parallel, keeping config colocated with its leaderboard
    const leaderboardCaches = c.var.referralLeaderboardEditionsCaches;
    const results = await Promise.all(
      editionConfigs.map(async (config) => {
        const cache = leaderboardCaches.get(config.slug);
        if (!cache) throw new Error(`Invariant: edition cache for ${config.slug} should exist`);
        return { config, leaderboard: await cache.read() };
      }),
    );

    // Partition into failures and successes in one pass
    const failedSlugs: ReferralProgramEditionSlug[] = [];
    const valid: {
      config: (typeof results)[number]["config"];
      leaderboard: ReferrerLeaderboard;
    }[] = [];
    for (const { config, leaderboard } of results) {
      if (leaderboard instanceof Error) {
        failedSlugs.push(config.slug);
      } else {
        valid.push({ config, leaderboard });
      }
    }

    if (failedSlugs.length > 0) {
      return c.json(
        serializeReferralProgramEditionSummariesResponse({
          responseCode: ReferralProgramEditionSummariesResponseCodes.Error,
          error: "Service Unavailable",
          errorMessage: `Leaderboard data not available for edition(s): ${failedSlugs.join(", ")}`,
        } satisfies ReferralProgramEditionSummariesResponse),
        503,
      );
    }

    const editions = valid.map(({ config, leaderboard }) =>
      buildEditionSummary(config, leaderboard),
    );

    return c.json(
      serializeReferralProgramEditionSummariesResponse({
        responseCode: ReferralProgramEditionSummariesResponseCodes.Ok,
        data: {
          editions,
        },
      } satisfies ReferralProgramEditionSummariesResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /v1/ensanalytics/editions endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      serializeReferralProgramEditionSummariesResponse({
        responseCode: ReferralProgramEditionSummariesResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies ReferralProgramEditionSummariesResponse),
      500,
    );
  }
});

export default app;
