import { serve } from "@hono/node-server";

import { getReferralEditionSnapshotsCaches } from "@/cache/referral-edition-snapshots.cache";
import di from "@/di";
import { sdk } from "@/lib/instrumentation";
import logger from "@/lib/logger";
import { INCLUDE_DEV_METHODS } from "@/omnigraph-api/lib/include-dev-methods";
import { writeGraphQLSchema } from "@/omnigraph-api/lib/write-graphql-schema";

import app from "./app";

// start ENSNode API OpenTelemetry SDK
sdk.start();

// start hono server
const server = serve(
  {
    fetch: app.fetch,
    port: di.context.ensApiConfig.port,
  },
  async (info) => {
    // Write the generated graphql schema in the background. Skipped when
    // a) in production, or
    // b) dev methods are enabled (to avoid dirty schema diff)
    const shouldWriteSchema = !(process.env.NODE_ENV === "production") && !INCLUDE_DEV_METHODS;
    if (shouldWriteSchema) void writeGraphQLSchema();

    // proactively warm up caches in the background
    void Promise.all([di.context.indexingStatusCache.read(), di.context.stackInfoCache.read()]);

    logger.info(`ENSApi listening on port ${info.port}`);
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

    // Destroy referral program edition config set cache
    di.context.referralProgramEditionConfigSetCache.destroy();
    logger.info("Destroyed referralProgramEditionConfigSetCache");

    // Destroy all edition caches (if initialized)
    const editionsCaches = getReferralEditionSnapshotsCaches();
    if (editionsCaches) {
      for (const [editionSlug, cache] of editionsCaches) {
        cache.destroy();
        logger.info(`Destroyed referralEditionSnapshotsCache for ${editionSlug}`);
      }
    }

    di.context.indexingStatusCache.destroy();
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
