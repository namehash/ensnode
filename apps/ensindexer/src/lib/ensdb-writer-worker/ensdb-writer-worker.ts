import { getUnixTime, secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";
import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  type CrossChainIndexingStatusSnapshot,
  type Duration,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";
import type { LocalPonderClient } from "@ensnode/ponder-sdk";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import { logger } from "@/lib/logger";
import type { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

/**
 * Interval in seconds between two consecutive attempts to upsert
 * the Indexing Status Snapshot record into ENSDb.
 */
const INDEXING_STATUS_RECORD_UPDATE_INTERVAL: Duration = 1;

/**
 * ENSDb Writer Worker
 *
 * A worker responsible for writing ENSIndexer-related metadata into ENSDb, including:
 * - ENSDb version
 * - ENSIndexer Public Config
 * - ENSIndexer Indexing Status Snapshots
 */
export class EnsDbWriterWorker {
  /**
   * Interval for recurring upserts of Indexing Status Snapshots into ENSDb.
   */
  private indexingStatusInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * ENSDb Client instance used by the worker to interact with ENSDb.
   */
  private ensDbClient: EnsDbWriter;

  /**
   * Indexing Status Builder instance used by the worker to read ENSIndexer Indexing Status.
   */
  private indexingStatusBuilder: IndexingStatusBuilder;

  /**
   * ENSIndexer Public Config Builder instance used by the worker to read ENSIndexer Public Config.
   */
  private publicConfigBuilder: PublicConfigBuilder;

  /**
   * Local Ponder Client instance
   *
   * Used to get local Ponder app command.
   */
  private localPonderClient: LocalPonderClient;

  /**
   * @param ensDbClient ENSDb Writer instance used by the worker to interact with ENSDb.
   * @param publicConfigBuilder ENSIndexer Public Config Builder instance used by the worker to read ENSIndexer Public Config.
   * @param indexingStatusBuilder Indexing Status Builder instance used by the worker to read ENSIndexer Indexing Status.
   * @param localPonderClient Local Ponder Client instance, used to get local Ponder app command.
   */
  constructor(
    ensDbClient: EnsDbWriter,
    publicConfigBuilder: PublicConfigBuilder,
    indexingStatusBuilder: IndexingStatusBuilder,
    localPonderClient: LocalPonderClient,
  ) {
    this.ensDbClient = ensDbClient;
    this.publicConfigBuilder = publicConfigBuilder;
    this.indexingStatusBuilder = indexingStatusBuilder;
    this.localPonderClient = localPonderClient;
  }

  /**
   * Run the ENSDb Writer Worker
   *
   * The worker performs the following tasks:
   * 1) A single attempt to upsert ENSDb version into ENSDb.
   * 2) A single attempt to upsert serialized representation of
   *   {@link EnsIndexerPublicConfig} into ENSDb.
   * 3) A recurring attempt to upsert serialized representation of
   *    {@link CrossChainIndexingStatusSnapshot} into ENSDb.
   *
   * @throws Error if the worker is already running, or
   *         if the in-memory ENSIndexer Public Config could not be fetched, or
   *         if the in-memory ENSIndexer Public Config is incompatible with the stored config in ENSDb.
   */
  public async run(): Promise<void> {
    // Do not allow multiple concurrent runs of the worker
    if (this.isRunning) {
      throw new Error("EnsDbWriterWorker is already running");
    }

    // Fetch data required for task 1 and task 2.
    const inMemoryConfig = await this.getValidatedEnsIndexerPublicConfig();

    // Task 1: upsert ENSDb version into ENSDb.
    logger.debug({ msg: "Upserting ENSDb version", module: "EnsDbWriterWorker" });
    await this.ensDbClient.upsertEnsDbVersion(inMemoryConfig.versionInfo.ensDb);
    logger.info({
      msg: "Upserted ENSDb version",
      ensDbVersion: inMemoryConfig.versionInfo.ensDb,
      module: "EnsDbWriterWorker",
    });

    // Task 2: upsert of EnsIndexerPublicConfig into ENSDb.
    logger.debug({
      msg: "Upserting ENSIndexer public config",
      module: "EnsDbWriterWorker",
    });
    await this.ensDbClient.upsertEnsIndexerPublicConfig(inMemoryConfig);
    logger.info({
      msg: "Upserted ENSIndexer public config",
      module: "EnsDbWriterWorker",
    });

    // Task 3: recurring upsert of Indexing Status Snapshot into ENSDb.
    this.indexingStatusInterval = setInterval(
      () => this.upsertIndexingStatusSnapshot(),
      secondsToMilliseconds(INDEXING_STATUS_RECORD_UPDATE_INTERVAL),
    );
  }

  /**
   * Indicates whether the ENSDb Writer Worker is currently running.
   */
  get isRunning(): boolean {
    return this.indexingStatusInterval !== null;
  }

  /**
   * Stop the ENSDb Writer Worker
   *
   * Stops all recurring tasks in the worker.
   */
  public stop(): void {
    if (this.indexingStatusInterval) {
      clearInterval(this.indexingStatusInterval);
      this.indexingStatusInterval = null;
    }
  }

  /**
   * Get validated ENSIndexer Public Config object for the ENSDb Writer Worker.
   *
   * The function retrieves the ENSIndexer Public Config object from both:
   * - stored config in ENSDb, if available, and
   * - in-memory config from ENSIndexer Client.
   *
   * If a stored config exists **and** the local Ponder app is **not** in dev
   * mode, the in-memory config is validated for compatibility against the
   * stored one. Validation is skipped if the local Ponder app is in dev mode,
   * allowing to override the stored config in ENSDb with the current in-memory
   * config, without having to keep them compatible.
   *
   * @returns The in-memory config when validation passes or no stored config
   *          exists.
   * @throws Error if either fetch fails, or if the in-memory config is
   *         incompatible with the stored config.
   */
  private async getValidatedEnsIndexerPublicConfig(): Promise<EnsIndexerPublicConfig> {
    /**
     * Fetch the in-memory config with retries, to handle potential transient errors
     * in the ENSIndexer Public Config Builder (e.g. due to network issues).
     * If the fetch fails after the defined number of retries, the error
     * will be thrown and the worker will not start, as the ENSIndexer Public Config
     * is a critical dependency for the worker's tasks.
     */
    const configFetchRetries = 3;

    logger.debug({
      msg: "Fetching ENSIndexer public config",
      retries: configFetchRetries,
      module: "EnsDbWriterWorker",
    });

    const inMemoryConfigPromise = pRetry(() => this.publicConfigBuilder.getPublicConfig(), {
      retries: configFetchRetries,
      onFailedAttempt: ({ attemptNumber, retriesLeft }) => {
        logger.warn({
          msg: "Config fetch attempt failed",
          attempt: attemptNumber,
          retriesLeft,
          module: "EnsDbWriterWorker",
        });
      },
    });

    let storedConfig: EnsIndexerPublicConfig | undefined;
    let inMemoryConfig: EnsIndexerPublicConfig;

    try {
      [storedConfig, inMemoryConfig] = await Promise.all([
        this.ensDbClient.getEnsIndexerPublicConfig(),
        inMemoryConfigPromise,
      ]);
      logger.info({
        msg: "Fetched ENSIndexer public config",
        module: "EnsDbWriterWorker",
        config: inMemoryConfig,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error({
        msg: "Failed to fetch ENSIndexer public config",
        error,
        module: "EnsDbWriterWorker",
      });

      // Throw the error to terminate the ENSIndexer process due to failed fetch of critical dependency
      throw new Error(errorMessage, {
        cause: error,
      });
    }

    // Validate in-memory config object compatibility with the stored one,
    // if the stored one is available.
    // The validation is skipped if the local Ponder app is running in dev mode.
    // This is to improve the development experience during ENSIndexer
    // development, by allowing to override the stored config in ENSDb with
    // the current in-memory config, without having to keep them compatible.
    if (storedConfig && !this.localPonderClient.isInDevMode) {
      try {
        validateEnsIndexerPublicConfigCompatibility(storedConfig, inMemoryConfig);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        logger.error({
          msg: "In-memory config incompatible with stored config",
          error,
          module: "EnsDbWriterWorker",
        });

        // Throw the error to terminate the ENSIndexer process due to
        // found config incompatibility
        throw new Error(errorMessage, {
          cause: error,
        });
      }
    }

    return inMemoryConfig;
  }

  /**
   * Upsert the current Indexing Status Snapshot into ENSDb.
   *
   * This method is called by the scheduler at regular intervals.
   * Errors are logged but not thrown, to keep the worker running.
   */
  private async upsertIndexingStatusSnapshot(): Promise<void> {
    try {
      // get system timestamp for the current iteration
      const snapshotTime = getUnixTime(new Date());

      const omnichainSnapshot = await this.getValidatedIndexingStatusSnapshot();

      const crossChainSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      await this.ensDbClient.upsertIndexingStatusSnapshot(crossChainSnapshot);
    } catch (error) {
      logger.error({
        msg: "Failed to upsert indexing status snapshot",
        error,
        module: "EnsDbWriterWorker",
      });
      // Do not throw the error, as failure to retrieve the Indexing Status
      // should not cause the ENSDb Writer Worker to stop functioning.
    }
  }

  /**
   * Get validated Omnichain Indexing Status Snapshot
   *
   * @returns Validated Omnichain Indexing Status Snapshot.
   * @throws Error if the Omnichain Indexing Status is not in expected status yet.
   */
  private async getValidatedIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const omnichainSnapshot = await this.indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();

    // It only makes sense to write Indexing Status Snapshots into ENSDb once
    // the indexing process has started, as before that there is no meaningful
    // status to record.
    // Invariant: the Omnichain Status must indicate that indexing has started already.
    if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
      throw new Error("Omnichain Status must not be 'Unstarted'.");
    }

    return omnichainSnapshot;
  }
}
