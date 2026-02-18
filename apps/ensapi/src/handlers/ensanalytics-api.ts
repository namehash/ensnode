import {
  getReferrerDetail,
  getReferrerLeaderboardPage,
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  serializeReferrerDetailResponse,
  serializeReferrerLeaderboardPageResponse,
} from "@namehash/ens-referrals";

import { createApp } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referrerLeaderboardMiddleware } from "@/middleware/referrer-leaderboard.middleware";

import { referrerDetailGetMeta, referrerLeaderboardGetMeta } from "./ensanalytics-api.routes";

const logger = makeLogger("ensanalytics-api");

const app = createApp();

// Apply referrer leaderboard cache middleware to all routes in this handler
app.use(referrerLeaderboardMiddleware);

// Get a page from the referrer leaderboard
app.openapi(referrerLeaderboardGetMeta, async (c) => {
  // context must be set by the required middleware
  if (c.var.referrerLeaderboard === undefined) {
    throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
  }

  try {
    if (c.var.referrerLeaderboard instanceof Error) {
      return c.json(
        serializeReferrerLeaderboardPageResponse({
          responseCode: ReferrerLeaderboardPageResponseCodes.Error,
          error: "Internal Server Error",
          errorMessage: "Failed to load referrer leaderboard data.",
        } satisfies ReferrerLeaderboardPageResponse),
        500,
      );
    }

    const { page, recordsPerPage } = c.req.valid("query");
    const leaderboardPage = getReferrerLeaderboardPage(
      { page, recordsPerPage },
      c.var.referrerLeaderboard,
    );

    return c.json(
      serializeReferrerLeaderboardPageResponse({
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: leaderboardPage,
      } satisfies ReferrerLeaderboardPageResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/referrers endpoint");
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

// Get referrer detail for a specific address
app.openapi(referrerDetailGetMeta, async (c) => {
  // context must be set by the required middleware
  if (c.var.referrerLeaderboard === undefined) {
    throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
  }

  try {
    // Check if leaderboard failed to load
    if (c.var.referrerLeaderboard instanceof Error) {
      return c.json(
        serializeReferrerDetailResponse({
          responseCode: ReferrerDetailResponseCodes.Error,
          error: "Service Unavailable",
          errorMessage: "Referrer leaderboard data has not been successfully cached yet.",
        } satisfies ReferrerDetailResponse),
        503,
      );
    }

    const { referrer } = c.req.valid("param");
    const detail = getReferrerDetail(referrer, c.var.referrerLeaderboard);

    return c.json(
      serializeReferrerDetailResponse({
        responseCode: ReferrerDetailResponseCodes.Ok,
        data: detail,
      } satisfies ReferrerDetailResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/referrers/:referrer endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      serializeReferrerDetailResponse({
        responseCode: ReferrerDetailResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies ReferrerDetailResponse),
      500,
    );
  }
});

export default app;
