/**
 * This module defines the initialization logic for the onchain event handlers of
 * the Ponder indexing engine executed in an ENSIndexer instance.
 *
 * Onchain event handlers are executed by Ponder once per ENSIndexer instance lifetime,
 * at the start of the omnichain indexing process.
 *
 * ENSIndexer startup sequence executed by Ponder:
 *  1. Connect to the database and initialize required database objects.
 *  2. Start the omnichain indexing process.
 *  3. Check whether Ponder Checkpoints are already initialized.
 *  4. If not:
 *     a) Execute setup handlers, if any were registered.
 *     b) Initialize Ponder Checkpoints.
 *  5. a) Make Ponder HTTP API usable.
 *  5. b) Start executing "onchain" event handlers.
 *
 * Step 4 is skipped on ENSIndexer instance restart if Ponder Checkpoints were
 * already initialized in a previous run. Also, step 4 a) is skipped if
 * no setup handlers were registered. Therefore, we don't implement any init
 * logic for setup handlers. Instead, to guarantee that any necessary initialization logic
 * is executed each time the ENSIndexer instance starts, we implement the init indexing onchain events logic
 * in this module, which is executed in step 5 b) and is guaranteed to be executed on every ENSIndexer instance startup,
 * regardless of the state of Ponder Checkpoints or whether any setup handlers were registered.
 */
import { getUnixTime } from "date-fns";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildEnsIndexerStackInfo,
  buildIndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import { migrateEnsNodeSchema } from "@/lib/ensdb/migrate-ensnode-schema";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { startEnsDbWriterWorker } from "@/lib/ensdb-writer-worker/singleton";
import {
  ensRainbowClient,
  waitForEnsRainbowToBeHealthy,
  waitForEnsRainbowToBeReady,
} from "@/lib/ensrainbow/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
import { logger } from "@/lib/logger";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";

/**
 * Prepare for executing the "onchain" event handlers.
 *
 * During Ponder startup, the "onchain" event handlers are executed
 * after all "setup" event handlers have completed.
 *
 * This function is useful to make sure any long-running preconditions for
 * onchain event handlers are met, for example, waiting for
 * the ENSRainbow instance to be ready before processing any onchain events
 * that require data from ENSRainbow.
 *
 * @example A single blocking precondition
 * ```ts
 * await waitForEnsRainbowToBeReady();
 * ```
 *
 * @example Multiple blocking preconditions
 * ```ts
 * await Promise.all([
 *   waitForEnsRainbowToBeReady(),
 *   waitForAnotherPrecondition(),
 * ]);
 * ```
 *
 * Goals of this function:
 * 1. Make ENSDb instance "ready" for ENSDb clients to use.
 */
export async function initIndexingOnchainEvents(): Promise<void> {
  // TODO: wait for ENSDb instance to be healthy
  // Ensure the ENSNode Schema in ENSDb is up to date by running any pending migrations.
  await migrateEnsNodeSchema();

  // Before calling `ensRainbowClient.config()`, we want to make sure that
  // the ENSRainbow instance is healthy and ready to serve requests.
  // This is a quick check, as we expect the ENSRainbow instance to be healthy
  // by the time ENSIndexer instance executes `initIndexingOnchainEvents`.
  await waitForEnsRainbowToBeHealthy();

  try {
    const [
      inMemoryIndexingStatusSnapshot,
      inMemoryEnsDbPublicConfig,
      inMemoryEnsIndexerPublicConfig,
      inMemoryEnsRainbowPublicConfig,
      storedIndexingMetadataContext,
    ] = await Promise.all([
      indexingStatusBuilder.getOmnichainIndexingStatusSnapshot(),
      ensDbClient.buildEnsDbPublicConfig(),
      publicConfigBuilder.getPublicConfig(),
      ensRainbowClient.config(),
      ensDbClient.getIndexingMetadataContext(),
    ]);

    if (
      storedIndexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Uninitialized
    ) {
      logger.info({
        msg: `Indexing Metadata Context is "uninitialized"`,
      });

      // Invariant: indexing status must be "unstarted" when the indexing metadata context is uninitialized,
      // since we haven't started processing any onchain events yet
      if (inMemoryIndexingStatusSnapshot.omnichainStatus !== OmnichainIndexingStatusIds.Unstarted) {
        throw new Error(
          `Omnichain indexing status must be "unstarted" for "uninitialized" Indexing Metadata Context. Provided omnichain indexing status "${inMemoryIndexingStatusSnapshot.omnichainStatus}".`,
        );
      }
    } else {
      logger.info({
        msg: `Indexing Metadata Context is "initialized"`,
      });
      logger.debug({
        msg: `Indexing Metadata Context`,
        indexingStatus: storedIndexingMetadataContext.indexingStatus,
        stackInfo: storedIndexingMetadataContext.stackInfo,
      });
      // if (ensIndexerPublicConfig.ensIndexerBuildId !== storedIndexingMetadataContext.stackInfo.ensIndexer.ensIndexerBuildId) {
      // TODO: store the `ensIndexerPublicConfig` object in ENSDb so `storedIndexingMetadataContext.stackInfo.ensIndexer` is updated
      // }
      const { ensIndexer: storedEnsIndexerPublicConfig } = storedIndexingMetadataContext.stackInfo;
      validateEnsIndexerPublicConfigCompatibility(
        inMemoryEnsIndexerPublicConfig,
        storedEnsIndexerPublicConfig,
      );
    }

    // Build the {@link CrossChainIndexingStatusSnapshot} with the current snapshot time.
    // This is important to make sure the `snapshotTime` is always up to date in
    // the indexing status snapshot stored in ENSDb.
    const now = getUnixTime(new Date());
    const crossChainIndexingStatusSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
      inMemoryIndexingStatusSnapshot,
      now,
    );

    // Build EnsIndexerStackInfo based on the current state of in-memory public
    // config objects. It's unlikely, but possible, that after the ENSIndexer
    // instance restarts, some values in the public config objects have changed
    // compared to the previous instance before the restart. For example,
    // if the ENSIndexer instance is redeployed with a new version of the code that has different default values for some config parameters, or if there are changes in the environment variables used to build the public config objects.
    const updatedStackInfo = buildEnsIndexerStackInfo(
      inMemoryEnsDbPublicConfig,
      inMemoryEnsIndexerPublicConfig,
      inMemoryEnsRainbowPublicConfig,
    );

    const updatedIndexingMetadataContext = buildIndexingMetadataContextInitialized(
      crossChainIndexingStatusSnapshot,
      updatedStackInfo,
    );

    logger.info({
      msg: `Upserting Indexing Metadata Context Initialized`,
    });
    logger.debug({
      msg: `Indexing Metadata Context`,
      indexingStatus: updatedIndexingMetadataContext.indexingStatus,
      stackInfo: updatedIndexingMetadataContext.stackInfo,
    });
    await ensDbClient.upsertIndexingMetadataContext(updatedIndexingMetadataContext);
    logger.info({
      msg: `Successfully upserted Indexing Metadata Context Initialized`,
    });

    // Before starting to process onchain events, we want to make sure that
    // ENSRainbow is ready and ready to serve the "heal" requests.
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
