/**
 * This file manages syncing ENSNode metadata:
 * - ENSIndexer Public Config
 * - Indexing Status
 * into the ENSDb.
 */
import config from "@/config";

import { secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import {
  CrossChainIndexingStatusSnapshot,
  type Duration,
  ENSIndexerPublicConfig,
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { validateENSIndexerPublicConfigCompatibility } from "@/config/compatibility";
import { EnsDbConnection, EnsDbMutation, EnsDbQuery } from "@/lib/ensdb";
import { ensIndexerClient, waitForEnsIndexerToBecomeHealthy } from "@/lib/ensindexer";
import { makeLogger } from "@/lib/logger";

const INDEXING_STATUS_RECORD_UPDATE_INTERVAL: Duration = 1;

const logger = makeLogger("ensdb-writer-worker");

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
  // 0. Wait for ENSIndexer to become healthy before running the worker's logic
  await waitForEnsIndexerToBecomeHealthy;

  // 1. Create ENSDb Client
  const ensDbConnection = new EnsDbConnection();
  const ensDbClient = ensDbConnection.connect({
    schemaName: config.databaseSchemaName,
    poolConfig: {
      connectionString: config.databaseUrl,
    },
  });

  logger.info("ENSDb Client connected");

  // 2. Create ENSDb Query object for read operations
  const ensDbQuery = new EnsDbQuery(ensDbClient);
  // 3. Create ENSDb Mutation object for write operations
  const ensDbMutation = new EnsDbMutation(ensDbClient);

  /**
   * Handle ENSIndexerPublicConfig Record
   */
  const handleEnsIndexerPublicConfigRecord = async () => {
    // Read stored config and in-memory config.
    // Note: we wrap read operations in pRetry to ensure all of them are
    // completed successfully.
    const [storedConfig, inMemoryConfig] = await pRetry(() =>
      Promise.all([ensDbQuery.getEnsIndexerPublicConfig(), ensIndexerClient.config()]),
    );

    // Validate in-memory config object compatibility with the stored one,
    // if the stored one is available
    if (storedConfig) {
      try {
        validateENSIndexerPublicConfigCompatibility(storedConfig, inMemoryConfig);
      } catch (error) {
        const errorMessage =
          "In-memory ENSIndexerPublicConfig object is not compatible with its counterpart stored in ENSDb.";

        logger.error(error, errorMessage);

        // Throw the error to terminate the ENSIndexer process due to
        // found config incompatibility
        throw new Error(errorMessage);
      }
    } else {
      // Upsert ENSIndexerPublicConfig into ENSDb.
      // Note: we wrap write operation in pRetry to ensure it can complete
      // successfully, as there will be no other attempt.
      await pRetry(() => ensDbMutation.upsertEnsIndexerPublicConfig(inMemoryConfig));
      logger.info("ENSIndexer Public Config successfully stored in ENSDb.");
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
      if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
        throw new Error("Omnichain Status  must be different that 'Unstarted'.");
      }

      // Upsert ENSIndexerPublicConfig into ENSDb.
      await ensDbMutation.upsertIndexingStatus(snapshot);

      logger.info("ENSIndexer Public Config successfully stored in ENSDb.");
    } catch (error) {
      // Do nothing about this error, but having it logged.
      logger.error(error, "Could not upsert Indexing Status record");
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
  await handleEnsIndexerPublicConfigRecord();

  // 5. Handle Indexing Status on recurring basis.
  await handleIndexingStatusRecordRecursively();
}

// Run ENSDb Writer Worker in a non-blocking way to
// allow database migrations to proceed in the background.
setTimeout(ensDbWriterWorker, 0);
