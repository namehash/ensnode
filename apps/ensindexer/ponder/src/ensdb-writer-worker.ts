/**
 * This file manages syncing ENSNode metadata:
 * - ENSIndexer Public Config
 * - Indexing Status
 * into the ENSDb.
 */
import config from "@/config";

import pRetry from "p-retry";

import {
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
  type SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { EnsDbConnection, EnsDbMutation, EnsDbQuery } from "@/lib/ensdb";
import { EnsIndexerClient } from "@/lib/ensindexer";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensdb-writer-worker");

const ensIndexerClient = new EnsIndexerClient(config.ensIndexerUrl);
const waitForEnsIndexerToBecomeHealthy = pRetry(async () => ensIndexerClient.health(), {
  retries: 5,
});

function isEnsIndexerPublicConfigCompatible<ConfigType extends SerializedENSIndexerPublicConfig>(
  configA: ConfigType,
  configB: ConfigType,
): boolean {
  if (
    !configA.indexedChainIds.every((configAChainId) =>
      configB.indexedChainIds.includes(configAChainId),
    )
  ) {
    return false;
  }

  if (configA.isSubgraphCompatible !== configB.isSubgraphCompatible) {
    return false;
  }

  if (configA.namespace !== configB.namespace) {
    return false;
  }

  if (!configA.plugins.every((configAPlugin) => configB.plugins.includes(configAPlugin))) {
    return false;
  }

  return true;
}

async function upsertEnsNodeMetadataRecords() {
  await waitForEnsIndexerToBecomeHealthy;

  const ensDbConnection = new EnsDbConnection();
  const ensDbClient = ensDbConnection.connect({
    schemaName: config.databaseSchemaName,
    poolConfig: {
      connectionString: config.databaseUrl,
    },
  });

  logger.info("ENSDb Client connected");

  const ensDbQuery = new EnsDbQuery(ensDbClient);
  const ensDbMutation = new EnsDbMutation(ensDbClient);

  const handleEnsIndexerPublicConfigRecord = async () => {
    const [storedConfig, inMemoryConfig] = await pRetry(() =>
      Promise.all([ensDbQuery.getEnsIndexerPublicConfig(), ensIndexerClient.config()]),
    );

    if (storedConfig && !isEnsIndexerPublicConfigCompatible(storedConfig, inMemoryConfig)) {
      throw new Error(
        "In-memory ENSIndexerPublicConfig object is not compatible with its counterpart stored in ENSDb.",
      );
    } else {
      // upsert ENSIndexerPublicConfig into ENSDb
      await ensDbMutation
        .upsertEnsIndexerPublicConfig(inMemoryConfig)
        .then(() => logger.info("ENSIndexer Public Config successfully stored in ENSDb."));
    }
  };

  // TODO: clear interval on application shutdown
  let _indexingStatusRefreshInterval: ReturnType<typeof setTimeout>;

  const handleIndexingStatusRecord = async () => {
    try {
      const inMemoryIndexingStatus = await ensIndexerClient.indexingStatus();

      if (inMemoryIndexingStatus.responseCode !== IndexingStatusResponseCodes.Ok) {
        throw new Error("Indexing Status must be available.");
      }

      const { snapshot } = inMemoryIndexingStatus.realtimeProjection;
      const { omnichainSnapshot } = snapshot;

      if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
        throw new Error("Omnichain Status  must be different that 'Unstarted'.");
      }

      // upsert ENSIndexerPublicConfig into ENSDb
      await ensDbMutation
        .upsertIndexingStatus(snapshot)
        .then(() => logger.info("ENSIndexer Public Config successfully stored in ENSDb."));
    } catch (error) {
      logger.error(error, "Could not upsert Indexing Status record");
    } finally {
      _indexingStatusRefreshInterval = setTimeout(handleIndexingStatusRecord, 1000);
    }
  };

  // 1. Handle ENSIndexer Public Config just once.
  await handleEnsIndexerPublicConfigRecord();

  // 2. Handle Indexing Status on recurring basis.
  await handleIndexingStatusRecord();
}

// Upsert ENSNode Metadata Records in a non-blocking way to
// allow database migrations to proceed in the background.
setTimeout(upsertEnsNodeMetadataRecords, 0);
