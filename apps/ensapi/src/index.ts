/**
 * Server entrypoint: starts the HTTP server, manages caches, and handles
 * graceful shutdown. The app itself (routes, middleware) is defined in app.ts.
 */

import config from "@/config";

import { serve } from "@hono/node-server";

import app from "@/app";
import { indexingStatusCache } from "@/cache/indexing-status.cache";
import { getReferralLeaderboardEditionsCaches } from "@/cache/referral-leaderboard-editions.cache";
import { referralProgramEditionConfigSetCache } from "@/cache/referral-program-edition-set.cache";
import { referrerLeaderboardCache } from "@/cache/referrer-leaderboard.cache";
import { redactEnsApiConfig } from "@/config/redact";
import { sdk } from "@/lib/instrumentation";
import logger from "@/lib/logger";

// start ENSNode API OpenTelemetry SDK
sdk.start();

// start hono server
const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  async (info) => {
    logger.info({ config: redactEnsApiConfig(config) }, `ENSApi listening on port ${info.port}`);

    // self-healthcheck to connect to ENSIndexer & warm Indexing Status cache
    await app.request("/health");
  },
);

// promisify hono server.close
const closeServer = () =>
  new Promise<void>((resolve, reject) =>
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    }),
  );

// perform graceful shutdown
const gracefulShutdown = async () => {
  try {
    await sdk.shutdown();
    logger.info("Destroyed tracing instrumentation");

    referrerLeaderboardCache.destroy();
    logger.info("Destroyed referrerLeaderboardCache");

    // Destroy referral program edition config set cache
    referralProgramEditionConfigSetCache.destroy();
    logger.info("Destroyed referralProgramEditionConfigSetCache");

    // Destroy all edition caches (if initialized)
    const editionsCaches = getReferralLeaderboardEditionsCaches();
    if (editionsCaches) {
      for (const [editionSlug, cache] of editionsCaches) {
        cache.destroy();
        logger.info(`Destroyed referralLeaderboardEditionsCache for ${editionSlug}`);
      }
    }

    indexingStatusCache.destroy();
    logger.info("Destroyed indexingStatusCache");

    await closeServer();
    logger.info("Closed application server");

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

// graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("uncaughtException", async (error) => {
  logger.error(error, "uncaughtException");
  await gracefulShutdown();
});
