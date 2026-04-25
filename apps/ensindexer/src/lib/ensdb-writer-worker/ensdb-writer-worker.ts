import { getUnixTime, secondsToMilliseconds } from "date-fns";
import type { Duration } from "enssdk";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";
import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildIndexingMetadataContextInitialized,
  type CrossChainIndexingStatusSnapshot,
  type EnsIndexerPublicConfig,
  type IndexingMetadataContext,
  IndexingMetadataContextStatusCodes,
} from "@ensnode/ensnode-sdk";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import { logger } from "@/lib/logger";

/**
 * Interval in seconds between two consecutive attempts to upsert
 * the Indexing Status Snapshot record into ENSDb.
 */
const INDEXING_STATUS_RECORD_UPDATE_INTERVAL: Duration = 1;

/**
 * ENSDb Writer Worker
 *
 * A worker responsible for writing the current {@link CrossChainIndexingStatusSnapshot} into
 * the {@link IndexingMetadataContext} record in ENSDb.
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
   * @param ensDbClient ENSDb Writer instance used by the worker to interact with ENSDb.
   * @param indexingStatusBuilder Indexing Status Builder instance used by the worker to read ENSIndexer Indexing Status.
   */
  constructor(ensDbClient: EnsDbWriter, indexingStatusBuilder: IndexingStatusBuilder) {
    this.ensDbClient = ensDbClient;
    this.indexingStatusBuilder = indexingStatusBuilder;
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

    // Task 1: recurring upsert of Indexing Metadata Context into ENSDb.
    this.indexingStatusInterval = setInterval(
      () => this.upsertIndexingMetadataContext(),
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
   * Upsert the current Indexing Status Snapshot into ENSDb.
   *
   * This method is called by the scheduler at regular intervals.
   * Errors are logged but not thrown, to keep the worker running.
   */
  private async upsertIndexingMetadataContext(): Promise<void> {
    try {
      // get system timestamp for the current iteration
      const snapshotTime = getUnixTime(new Date());
      const indexingMetadataContext = await this.ensDbClient.getIndexingMetadataContext();

      if (indexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Uninitialized) {
        throw new Error(
          `Cannot upsert Indexing Status Snapshot into ENSDb because Indexing Metadata Context should be be initialized first`,
        );
      }

      const omnichainSnapshot =
        await this.indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();

      const updatedIndexingMetadataContext = buildIndexingMetadataContextInitialized(
        buildCrossChainIndexingStatusSnapshotOmnichain(omnichainSnapshot, snapshotTime),
        indexingMetadataContext.stackInfo,
      );

      await this.ensDbClient.upsertIndexingMetadataContext(updatedIndexingMetadataContext);
    } catch (error) {
      logger.error({
        msg: "Failed to upsert indexing metadata context",
        error,
        module: "EnsDbWriterWorker",
      });
      // Do not throw the error, as failure to retrieve the Indexing Status
      // should not cause the ENSDb Writer Worker to stop functioning.
    }
  }
}
