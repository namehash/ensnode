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
// initialize DI container and its resources in a non-blocking way to
// allow HTTP server to start immediately and serve requests
void di.init().catch((error) => {
  logger.error(error, "Error initializing DI container");
  process.exit(1);
});

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
    // Close the server to stop accepting new requests
    await closeServer();
    logger.info("Closed application server");

    // Shutdown the OpenTelemetry SDK to flush any remaining spans
    await sdk.shutdown();
    logger.info("Destroyed tracing instrumentation");

    // Destroy all edition caches (if initialized)
    const editionsCaches = getReferralEditionSnapshotsCaches();
    if (editionsCaches) {
      for (const [editionSlug, cache] of editionsCaches) {
        cache.destroy();
        logger.info(`Destroyed referralEditionSnapshotsCache for ${editionSlug}`);
      }
    }

    // Destroy DI container resources
    await di.destroy();

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
