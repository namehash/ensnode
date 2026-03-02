import { getUnixTime, secondsToMilliseconds } from "date-fns";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  type CrossChainIndexingStatusSnapshot,
  type Duration,
  type EnsIndexerClient,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "@/lib/ensdb-client/ensdb-client";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";

/**
 * Interval in seconds between two consecutive attempts to upsert
 * the Indexing Status Snapshot record into ENSDb.
 */
const INDEXING_STATUS_RECORD_UPDATE_INTERVAL: Duration = 5;

/**
 * ENSDb Writer Worker
 *
 * A worker responsible for writing ENSIndexer-related data into ENSDb, including:
 * - ENSDb version
 * - ENSIndexer Public Config
 * - ENSIndexer Indexing Status Snapshots
 */
export class EnsDbWriterWorker {
  /**
   * AbortController instance used to signal the worker to stop its recurring tasks.
   */
  private abortController: AbortController = new AbortController();

  /**
   * ENSDb Client instance used by the worker to interact with ENSDb.
   */
  private ensDbClient: EnsDbClient;

  /**
   * ENSIndexer Client instance used by the worker to read ENSIndexer Public Config.
   */
  private ensIndexerClient: EnsIndexerClient;

  /**
   * Indexing Status Builder instance used by the worker to read ENSIndexer Indexing Status.
   */
  private indexingStatusBuilder: IndexingStatusBuilder;

  /**
   * @param ensDbClient ENSDb Client instance used by the worker to interact with ENSDb.
   * @param ensIndexerClient ENSIndexer Client instance used by the worker to read ENSIndexer Public Config.
   * @param indexingStatusBuilder Indexing Status Builder instance used by the worker to read ENSIndexer Indexing Status.
   */
  constructor(
    ensDbClient: EnsDbClient,
    ensIndexerClient: EnsIndexerClient,
    indexingStatusBuilder: IndexingStatusBuilder,
  ) {
    this.ensDbClient = ensDbClient;
    this.ensIndexerClient = ensIndexerClient;
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
   */
  public async run(): Promise<void> {
    // Fetch data required for task 1 and task 2.
    const inMemoryConfig = await this.getValidatedEnsIndexerPublicConfig();

    // Task 1: upsert ENSDb version into ENSDb.
    console.log(`[EnsDbWriterWorker]: Upserting ENSDb version into ENSDb...`);
    await this.ensDbClient.upsertEnsDbVersion(inMemoryConfig.versionInfo.ensDb);
    console.log(
      `[EnsDbWriterWorker]: ENSDb version upserted successfully: ${inMemoryConfig.versionInfo.ensDb}`,
    );

    // Task 2: upsert of EnsIndexerPublicConfig into ENSDb.
    console.log(`[EnsDbWriterWorker]: Upserting ENSIndexer Public Config into ENSDb...`);
    await this.ensDbClient.upsertEnsIndexerPublicConfig(inMemoryConfig);
    console.log(`[EnsDbWriterWorker]: ENSIndexer Public Config upserted successfully`);

    // Task 3: recurring upsert of Indexing Status Snapshot into ENSDb.
    const indexingStatusSnapshotStream = this.getIndexingStatusSnapshotStream();

    for await (const snapshot of indexingStatusSnapshotStream) {
      console.log(`[EnsDbWriterWorker]: Upserting Indexing Status Snapshot into ENSDb...`);
      await this.ensDbClient.upsertIndexingStatusSnapshot(snapshot);
      console.log(`[EnsDbWriterWorker]: Indexing Status Snapshot upserted successfully`);
    }
  }

  /**
   * Run the ENSDb Writer Worker with retry behavior.
   *
   * Retries the {@link run} method up to `maxRetries` times if it throws,
   * waiting the same interval used for indexing status updates between attempts.
   *
   * @param options.maxRetries Maximum number of attempts before throwing.
   * @throws Error if the number of attempts exceeds `maxRetries` or if the worker is stopped before a successful run.
   */
  public async runWithRetries(options: { maxRetries: number }): Promise<void> {
    let attempt = 0;

    while (!this.isStopped) {
      attempt += 1;

      try {
        await this.run();
        return;
      } catch (error) {
        if (this.isStopped) {
          return;
        }

        console.error(`[EnsDbWriterWorker]: Error in run attempt #${attempt}:`, error);

        if (attempt >= options.maxRetries) {
          throw new Error(`ENSDb Writer Worker failed after ${attempt} attempts.`, {
            cause: error,
          });
        }

        // Wait for the configured delay before the next attempt. This also
        // ensures that if the worker is stopped while waiting, it will
        // not start a new attempt.
        await this.nextTryDelay();
      }
    }

    // If the loop exits due to the worker being stopped,
    // ensure that we do not treat it as an error case.
    if (!this.isStopped) {
      throw new Error("ENSDb Writer Worker could not process all tasks successfully.");
    }
  }

  /**
   * Stop the ENSDb Writer Worker
   *
   * Stops all recurring tasks in the worker.
   */
  public stop(): void {
    if (!this.isStopped) {
      this.abortController.abort();
    }
  }

  /**
   * Indicates whether the ENSDb Writer Worker is stopped.
   */
  get isStopped(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * Get validated ENSIndexer Public Config object for the ENSDb Writer Worker.
   *
   * The function retrieves the ENSIndexer Public Config object from both:
   * - stored config in ENSDb, if available, and
   * - in-memory config from ENSIndexer Client.
   *
   * If, and only if, a stored config is available in ENSDb, then the function
   * validates the compatibility of the in-memory config object against
   * the stored one. Validation criteria are defined in the function body.
   *
   * @returns In-memory config object, if the validation is successful or
   *          if there is no stored config.
   * @throws Error if the in-memory config object is incompatible with
   *         the stored one.
   */
  private async getValidatedEnsIndexerPublicConfig(): Promise<EnsIndexerPublicConfig> {
    const [storedConfig, inMemoryConfig] = await Promise.all([
      this.ensDbClient.getEnsIndexerPublicConfig(),
      this.ensIndexerClient.config(),
    ]);

    // Validate in-memory config object compatibility with the stored one,
    // if the stored one is available
    if (storedConfig) {
      try {
        validateEnsIndexerPublicConfigCompatibility(storedConfig, inMemoryConfig);
      } catch (error) {
        const errorMessage = `In-memory ENSIndexer Public Config object is not compatible with its counterpart stored in ENSDb.`;

        console.error(`[EnsDbWriterWorker]: ${errorMessage}`);

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
   * Get Indexing Status Snapshot Stream
   *
   * An async generator function that yields validated Indexing Status Snapshots
   * retrieved from Indexing Status Builder at a regular interval defined by
   * `INDEXING_STATUS_RECORD_UPDATE_INTERVAL`. The generator stops yielding
   * snapshots when the worker is stopped.
   *
   * Note: failure to retrieve the Indexing Status from Indexing Status Builder
   * or failure to validate the retrieved Indexing Status Snapshot does not
   * cause the generator to throw an error. Instead, the generator continues
   * with the next attempt after the specified delay.
   *
   * @yields validated Indexing Status Snapshots retrieved from Indexing Status Builder.
   *          Validation criteria are defined in the function body.
   * @returns void when the worker is stopped.
   */
  private async *getIndexingStatusSnapshotStream(): AsyncGenerator<CrossChainIndexingStatusSnapshot> {
    while (!this.isStopped) {
      try {
        // get system timestamp for the current iteration of the loop
        const snapshotTime = getUnixTime(new Date());

        const omnichainSnapshot =
          await this.indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();

        // Invariant: the Omnichain Status must indicate that indexing has started already.
        if (omnichainSnapshot.omnichainStatus === OmnichainIndexingStatusIds.Unstarted) {
          throw new Error("Omnichain Status must not be 'Unstarted'.");
        }

        const crossChainSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
          omnichainSnapshot,
          snapshotTime,
        );

        // Yield the validated indexing status snapshot
        yield crossChainSnapshot;
      } catch (error) {
        console.error(
          `[EnsDbWriterWorker]: Error retrieving or validating Indexing Status Snapshot:`,
          error,
        );
        // Do not throw the error, as failure to retrieve the Indexing Status
        // should not cause the ENSDb Writer Worker to stop functioning.
        // Instead, continue with the next attempt after the delay.
      } finally {
        // Regardless of success or failure of the attempt to retrieve the Indexing Status,
        // wait for the configured delay before the next attempt.
        await this.nextTryDelay();
      }
    }
  }

  /**
   * Resolves after the configured interval, or immediately if the worker
   * has been stopped. Prevents hanging on shutdown mid-wait.
   */
  private nextTryDelay(): Promise<void> {
    return new Promise((resolve) => {
      // Do not delay if the worker is already stopped, to allow for prompt shutdown.
      if (this.isStopped) {
        return resolve();
      }

      // When abort signal is received,
      // clear the timeout and resolve immediately to allow for prompt shutdown.
      const onAbort = (): void => {
        clearTimeout(timeout);
        resolve();
      };

      const timeout = setTimeout(() => {
        // Clear the abort event listener after the timeout completes, to prevent memory leaks.
        this.abortController.signal.removeEventListener("abort", onAbort);

        resolve();
      }, secondsToMilliseconds(INDEXING_STATUS_RECORD_UPDATE_INTERVAL));

      // If the worker is stopped while waiting,
      // resolve immediately to allow for prompt shutdown.
      this.abortController.signal.addEventListener("abort", onAbort, { once: true });
    });
  }
}
