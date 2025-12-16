/**
 * This file manages syncing ENSNode metadata:
 * - ENSIndexer Public Config
 * - Indexing Status
 * into the ENSDb.
 */
import config from "@/config";

import pRetry from "p-retry";

import {
  type CrossChainIndexingStatusSnapshot,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
  type SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { EnsDbConnection, EnsDbWriterClient } from "@/lib/ensdb";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensdb-writer-worker");

/**
 * Wait for ENSIndexer to become healthy.
 *
 * @throws when the Health endpoint didn't return HTTP Status OK.
 */
async function waitForEnsIndexerHealthy(): Promise<void> {
  logger.info("Fetching ENSIndexer Health status");

  try {
    await fetch(new URL("/health", config.ensIndexerUrl));

    logger.info("ENSIndexer is healthy");
  } catch {
    const errorMessage = "Health endpoint for ENSIndexer is not available yet.";
    logger.error(errorMessage);

    throw new Error(errorMessage);
  }
}

interface FetchEnsNodeMetadataResult {
  ensIndexerPublicConfigSerialized: SerializedENSIndexerPublicConfig;
  indexingStatusSnapshot: CrossChainIndexingStatusSnapshot;
}

/**
 * Fetch ENSNode metadata.
 *
 * @returns ENSNode metadata when it's available and with valid Indexing Status.
 * @throws error when ENSNode metadata was not available, or was available but with invalid Indexing Status.
 */
async function fetchEnsNodeMetadata(): Promise<FetchEnsNodeMetadataResult> {
  logger.info("Fetching ENSNode metadata");

  const [ensIndexerPublicConfigSerialized, indexingStatusSerialized] = await Promise.all([
    fetch(new URL("/api/config", config.ensIndexerUrl))
      .then((response) => response.json())
      .then((response) => response as unknown as SerializedENSIndexerPublicConfig),
    fetch(new URL("/api/indexing-status", config.ensIndexerUrl))
      .then((response) => response.json())
      .then((response) => response as unknown as IndexingStatusResponse),
  ]);

  logger.info("Fetched ENSNode metadata");

  if (indexingStatusSerialized.responseCode === IndexingStatusResponseCodes.Ok) {
    const { snapshot } = indexingStatusSerialized.realtimeProjection;
    const { omnichainSnapshot } = snapshot;

    if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
      throw new Error("Indexing Status ID must be different that 'Unstarted'.");
    }

    return {
      ensIndexerPublicConfigSerialized,
      indexingStatusSnapshot: snapshot,
    };
  }

  throw new Error("Indexing Status must be available.");
}

async function upsertEnsNodeMetadataRecords() {
  await pRetry(waitForEnsIndexerHealthy, { retries: 5 });

  const ensDbConnection = new EnsDbConnection();
  const ensDbClient = ensDbConnection.connect({
    schemaName: config.databaseSchemaName,
    poolConfig: {
      connectionString: config.databaseUrl,
    },
  });

  logger.info("ENSDb Client connected");

  const ensDbWriterClient = new EnsDbWriterClient(ensDbClient);

  const { ensIndexerPublicConfigSerialized, indexingStatusSnapshot } = await pRetry(
    fetchEnsNodeMetadata,
    {
      retries: 5,
    },
  );

  await pRetry(() =>
    Promise.all([
      ensDbWriterClient
        .upsertEnsIndexerPublicConfig(ensIndexerPublicConfigSerialized)
        .then(() => logger.info("ENSIndexer Public Config successfully stored in ENSDb.")),

      ensDbWriterClient
        .upsertIndexingStatus(indexingStatusSnapshot)
        .then(() => logger.info("Indexing Status successfully stored in ENSDb.")),
    ]),
  );
}

// Upsert ENSNode Metadata Records in a non-blocking way to
// allow database migrations to proceed in the background.
setTimeout(upsertEnsNodeMetadataRecords, 0);
