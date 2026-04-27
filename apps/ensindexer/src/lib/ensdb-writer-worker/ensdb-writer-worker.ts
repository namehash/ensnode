import { secondsToMilliseconds } from "date-fns";
import type { Duration } from "enssdk";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";

import type { IndexingMetadataContextBuilder } from "@/lib/indexing-metadata-context-builder/indexing-metadata-context-builder";
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
   * Interval for recurring updates of Indexing Status Snapshots into ENSDb.
   */
  private indexingStatusUpdateInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * {@link EnsDbWriter} instance used by the worker to interact with ENSDb instance.
   */
  private ensDbClient: EnsDbWriter;

  /**
   * {@link IndexingMetadataContextBuilder} instance used by the worker to read {@link IndexingMetadataContext}.
   */
  private indexingMetadataContextBuilder: IndexingMetadataContextBuilder;

  /**
   * @param ensDbClient ENSDb Writer instance used by the worker to interact with ENSDb.
   * @param indexingMetadataContextBuilder {@link IndexingMetadataContextBuilder} instance used by
   *        the worker to read {@link IndexingMetadataContext}.
   */
  constructor(
    ensDbClient: EnsDbWriter,
    indexingMetadataContextBuilder: IndexingMetadataContextBuilder,
  ) {
    this.ensDbClient = ensDbClient;
    this.indexingMetadataContextBuilder = indexingMetadataContextBuilder;
  }

  /**
   * Run the ENSDb Writer Worker
   *
   * The worker performs a recurring upsert of
   * the {@link IndexingMetadataContext} record into ENSDb.
   *
   * @throws Error if the worker is already running.
   */
  public async run(): Promise<void> {
    // Do not allow multiple concurrent runs of the worker
    if (this.isRunning) {
      throw new Error("EnsDbWriterWorker is already running");
    }

    // Recurring update of the IndexingMetadataRecord record in ENSDb.
    this.indexingStatusUpdateInterval = setInterval(
      () =>
        this.updateIndexingMetadataContext().catch((error) => {
          logger.error({
            msg: "Failed to update indexing metadata context record in ENSDb",
            module: "EnsDbWriterWorker",
            error,
          });

          // Updating the IndexingMetadataContext record in ENSDb is
          // a critical operation for the ENSIndexer instance,
          // therefore if any error happens during this operation,
          // we want to stop the worker to prevent further errors,
          // and exit the process with a non-zero exit code.
          this.stop();

          process.exitCode = 1;
          throw error;
        }),
      secondsToMilliseconds(INDEXING_STATUS_RECORD_UPDATE_INTERVAL),
    );
  }

  /**
   * Indicates whether the ENSDb Writer Worker is currently running.
   */
  get isRunning(): boolean {
    return this.indexingStatusUpdateInterval !== null;
  }

  /**
   * Stop the ENSDb Writer Worker
   *
   * Stops all recurring tasks in the worker.
   */
  public stop(): void {
    if (this.indexingStatusUpdateInterval) {
      clearInterval(this.indexingStatusUpdateInterval);
      this.indexingStatusUpdateInterval = null;
    }
  }

  /**
   * Update the current Indexing Status Snapshot into ENSDb.
   *
   * This method is called by the scheduler at regular intervals from {@link run}.
   *
   * @throws Error if the update operation fails.
   */
  private async updateIndexingMetadataContext(): Promise<void> {
    const indexingMetadataContext =
      await this.indexingMetadataContextBuilder.getIndexingMetadataContext();

    await this.ensDbClient.upsertIndexingMetadataContext(indexingMetadataContext);
  }
}
