/**
 * This module defines the initialization logic to be executed by
 * the ENSIndexer instance before it starts executing any "onchain"
 * event handlers.
 */

import { migrateEnsNodeSchema } from "@/lib/ensdb/migrate-ensnode-schema";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { startEnsDbWriterWorker } from "@/lib/ensdb-writer-worker/singleton";
import {
  waitForEnsRainbowToBeHealthy,
  waitForEnsRainbowToBeReady,
} from "@/lib/ensrainbow/singleton";
import { indexingMetadataContextBuilder } from "@/lib/indexing-metadata-context-builder/singleton";
import { logger } from "@/lib/logger";

async function upsertIndexingMetadataContextRecord(): Promise<void> {
  const indexingMetadataContext = await indexingMetadataContextBuilder.getIndexingMetadataContext();

  logger.info({
    msg: `Upserting Indexing Metadata Context Initialized`,
  });
  logger.debug({
    msg: `Indexing Metadata Context`,
    indexingStatus: indexingMetadataContext.indexingStatus,
    stackInfo: indexingMetadataContext.stackInfo,
  });

  await ensDbClient.upsertIndexingMetadataContext(indexingMetadataContext);

  logger.info({
    msg: `Successfully upserted Indexing Metadata Context Initialized`,
  });
}

/**
 * Initialize indexing of "onchain" events
 *
 * This function is guaranteed to be called exactly once by
 * `eventHandlerPreconditions` before executing any "onchain" event handlers,
 * and is used to initialize the ENSNode Schema.
 *
 * Each time the ENSIndexer instance starts, the logic in this function will be
 * executed. Therefore, all logic must be idempotent and concurrency-safe,
 * to prevent any issues during the startup of the ENSIndexer instance.
 * For example, multiple ENSIndexer instances might be started at the same time,
 * and they might all execute the logic in this function concurrently,
 * so we need to make sure that this does not cause any unexpected side effects.
 */
export async function initIndexingOnchainEvents(): Promise<void> {
  try {
    // TODO: wait for ENSDb instance to be healthy before running any queries against it.

    // Ensure the ENSNode Schema in ENSDb is up to date by running any pending migrations.
    await migrateEnsNodeSchema();

    // Before calling `ensRainbowClient.config()`, we want to make sure that
    // the ENSRainbow instance is healthy and ready to serve requests.
    // This is a quick check, as we expect the ENSRainbow instance to be healthy
    // by the time ENSIndexer instance executes `initIndexingOnchainEvents`.
    await waitForEnsRainbowToBeHealthy();

    // Upsert the Indexing Metadata Context record into ENSDb
    await upsertIndexingMetadataContextRecord();

    // Before starting to process onchain events, we want to make sure that
    // ENSRainbow is ready to serve the "heal" requests.
    await waitForEnsRainbowToBeReady();

    // TODO: start Indexing Status Sync worker
    // It will be responsible for keeping the indexing status stored within Indexing Metadata Context record in ENSDb up to date
    // await indexingStatusSyncWorker.start();
    startEnsDbWriterWorker();
  } catch (error) {
    // If any error happens during the initialization of indexing of onchain events,
    // we want to log the error and exit the process with a non-zero exit code,
    // since this is a critical failure that prevents the ENSIndexer instance from functioning properly.
    logger.error({
      msg: "Failed to initialize the onchain events indexing",
      module: "init-indexing-onchain-events",
      error,
    });

    process.exitCode = 1;
    throw error;
  }
}
