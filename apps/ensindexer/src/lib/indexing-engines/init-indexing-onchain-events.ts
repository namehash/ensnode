import { getUnixTime } from "date-fns/fp/getUnixTime";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildEnsIndexerStackInfo,
  buildIndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { ensDbClient } from "@/lib/ensdb/singleton";
import { startEnsDbWriterWorker } from "@/lib/ensdb-writer-worker/singleton";
import { ensRainbowClient, waitForEnsRainbowToBeReady } from "@/lib/ensrainbow/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
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
 */
export async function initIndexingOnchainEvents(): Promise<void> {
  try {
    const indexingMetadataContext = await ensDbClient.getIndexingMetadataContext();
    console.log("Indexing Metadata Context:", indexingMetadataContext);
    const indexingStatus = await indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();
    const ensIndexerPublicConfig = await publicConfigBuilder.getPublicConfig();
    const ensDbPublicConfig = await ensDbClient.buildEnsDbPublicConfig();

    if (indexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Uninitialized) {
      // Invariant: indexing status must be "unstarted"
      if (indexingStatus.omnichainStatus !== OmnichainIndexingStatusIds.Unstarted) {
        throw new Error(
          `Invariant violation: expected omnichain indexing status to be "unstarted" when initializing indexing of onchain events for the first time, but got "${indexingStatus.omnichainStatus}" instead`,
        );
      }
    } else {
      // if (ensIndexerPublicConfig.ensIndexerBuildId !== indexingMetadataContext.stackInfo.ensIndexer.ensIndexerBuildId) {
      // TODO: store the `ensIndexerPublicConfig` object in ENSDb so `indexingMetadataContext.stackInfo.ensIndexer` is updated
      // }
    }

    await waitForEnsRainbowToBeReady();

    const ensRainbowPublicConfig = await ensRainbowClient.config();
    const now = getUnixTime(new Date());
    const updatedIndexingMetadataContext = buildIndexingMetadataContextInitialized(
      buildCrossChainIndexingStatusSnapshotOmnichain(indexingStatus, now),
      buildEnsIndexerStackInfo(ensDbPublicConfig, ensIndexerPublicConfig, ensRainbowPublicConfig),
    );

    // TODO: check ENSRainbow compatibility
    if (
      ensRainbowPublicConfig.serverLabelSet.labelSetId <
      ensIndexerPublicConfig.clientLabelSet.labelSetId
    ) {
      throw new Error(
        `ENSRainbow instance is not compatible with the current ENSIndexer instance: ENSRainbow serverLabelSetId (${ensRainbowPublicConfig.serverLabelSet.labelSetId}) is less than ENSIndexer clientLabelSetId (${ensIndexerPublicConfig.clientLabelSet.labelSetId})`,
      );
    }

    await ensDbClient.upsertIndexingMetadataContext(updatedIndexingMetadataContext);

    // TODO: start Indexing Status Sync worker
    // It will be responsible for keeping the indexing status stored within Indexing Metadata Context record in ENSDb up to date
    // await indexingStatusSyncWorker.start();
    startEnsDbWriterWorker();
  } catch (error) {
    // If any error happens during the execution of the preconditions for onchain events,
    // we want to log the error and exit the process with a non-zero exit code,
    // since this is a critical failure that prevents the ENSIndexer instance from functioning properly.
    console.error("Failed to execute preconditions for onchain events:", error);
    process.exit(1);
  }
}
