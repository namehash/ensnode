/**
 * This file manages syncing ENSNode metadata:
 * - ENSIndexer Public Config
 * - Indexing Status
 * into the ENSDb.
 */
import { secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import {
  CrossChainIndexingStatusSnapshot,
  type Duration,
  ENSIndexerPublicConfig,
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
  validateENSIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import { EnsDbClient } from "@/lib/ensdb";
import { ensIndexerClient, waitForEnsIndexerToBecomeHealthy } from "@/lib/ensindexer";

const INDEXING_STATUS_RECORD_UPDATE_INTERVAL: Duration = 1;

/**
 * ENSDb Writer Worker
 *
 * Runs the following tasks:
 * 1) On application startup, attempt to upsert serialized representation of
 *    {@link ENSIndexerPublicConfig} into ENSDb.
 * 2) On application startup, and then on recurring basis,
 *    following the {@link INDEXING_STATUS_RECORD_UPDATE_INTERVAL}, attempt to
 *    upsert serialized representation of {@link CrossChainIndexingStatusSnapshot}
 *    into ENSDb.
 */
async function ensDbWriterWorker() {
  console.log("ENSDb Writer Worker: waiting for ENSIndexer to become healthy.");

  // 0. Wait for ENSIndexer to become healthy before running the worker's logic
  await waitForEnsIndexerToBecomeHealthy;

  console.log("ENSDb Writer Worker: ENSIndexer is healthy, starting tasks.");

  // 1. Create ENSDb Client
  const ensDbClient = new EnsDbClient();

  /**
   * Handle ENSIndexerPublicConfig Record
   */
  const handleEnsIndexerPublicConfigRecord = async () => {
    // Read stored config and in-memory config.
    // Note: we wrap each operation in pRetry to ensure all of them can be
    // completed successfully.
    const [storedConfig, inMemoryConfig] = await Promise.all([
      pRetry(() => ensDbClient.getEnsIndexerPublicConfig()),
      pRetry(() => ensIndexerClient.config()),
    ]);

    // Validate in-memory config object compatibility with the stored one,
    // if the stored one is available
    if (storedConfig) {
      try {
        validateENSIndexerPublicConfigCompatibility(storedConfig, inMemoryConfig);
      } catch (error) {
        const errorMessage = `In-memory ENSIndexerPublicConfig object is not compatible with its counterpart stored in ENSDb.`;

        // Throw the error to terminate the ENSIndexer process due to
        // found config incompatibility
        throw new Error(errorMessage, {
          cause: error,
        });
      }
    } else {
      // Upsert ENSIndexerPublicConfig into ENSDb.
      await ensDbClient.upsertEnsIndexerPublicConfig(inMemoryConfig);
    }
  };

  /**
   * Handle Indexing Status Record Recursively
   */
  const handleIndexingStatusRecordRecursively = async () => {
    try {
      // Read in-memory Indexing Status.
      const inMemoryIndexingStatus = await ensIndexerClient.indexingStatus();

      // Check if Indexing Status is available.
      if (inMemoryIndexingStatus.responseCode !== IndexingStatusResponseCodes.Ok) {
        throw new Error("Indexing Status must be available.");
      }

      const { snapshot } = inMemoryIndexingStatus.realtimeProjection;
      const { omnichainSnapshot } = snapshot;

      // Check if Indexing Status is in expected status.
      // The Omnichain Status must indicate that indexing has started already.
      // Throw an error if Omnichain Status is "Unstarted".
      if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
        throw new Error("Omnichain Status must be different than 'Unstarted'.");
      }

      // Upsert ENSIndexerPublicConfig into ENSDb.
      await ensDbClient.upsertIndexingStatus(snapshot);
    } catch (error) {
      // Do nothing about this error, but having it logged.
      console.error(error, "Could not upsert Indexing Status record");
    } finally {
      // Regardless of current iteration result,
      // schedule the next callback to handle Indexing Status Record.
      setTimeout(
        handleIndexingStatusRecordRecursively,
        secondsToMilliseconds(INDEXING_STATUS_RECORD_UPDATE_INTERVAL),
      );
    }
  };

  // 4. Handle ENSIndexer Public Config just once.
  console.log("Task: store ENSIndexer Public Config in ENSDb.");
  await handleEnsIndexerPublicConfigRecord().then(() =>
    console.log("ENSIndexer Public Config successfully stored in ENSDb."),
  );

  // 5. Handle Indexing Status on recurring basis.
  console.log("Task: store Indexing Status in ENSDb.");
  await handleIndexingStatusRecordRecursively().then(() =>
    console.log("Indexing Status successfully stored in ENSDb."),
  );
}

// Run ENSDb Writer Worker in a non-blocking way to
// allow database migrations to proceed in the background.
ensDbWriterWorker().catch((error) =>
  console.error("ENSDb Writer Worker failed to perform its tasks", error),
);
