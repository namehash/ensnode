/**
 * This module defines the initialization logic for the setup handlers of
 * the Ponder indexing engine executed in an ENSIndexer instance.
 *
 * Setup handlers are executed by Ponder once per ENSIndexer instance lifetime,
 * at the start of the omnichain indexing process.
 *
 * ENSIndexer startup sequence executed by Ponder:
 *  1. Connect to the database and initialize required database objects.
 *  2. Start the omnichain indexing process.
 *  3. Check whether Ponder Checkpoints are already initialized.
 *  4. If not:
 *     a) Execute setup handlers.
 *     b) Initialize Ponder Checkpoints.
 *  5. a) Make Ponder HTTP API usable.
 *  5. b) Start executing "onchain" event handlers.
 *
 * Step 4 is skipped on ENSIndexer instance restart if Ponder Checkpoints were
 * already initialized in a previous run.
 */

import { logger } from "@/lib/logger";

/**
 * Initialize indexing setup
 *
 * Runs once per ENSIndexer instance lifetime to initialize indexing setup.
 *
 * Since multiple ENSIndexer instances may run concurrently against the same
 * ENSDb instance, this function MUST BE idempotent and race-condition-safe.
 *
 * Completion of this function unblocks the following sequence of events
 * during ENSIndexer startup:
 *  1. "setup" event handlers execute
 *  2. Ponder Checkpoints initialize
 *  3. IndexingStatusBuilder can build OmnichainIndexingStatusSnapshot
 *     via LocalPonderClient (which queries the Ponder HTTP API)
 *
 * @throws Error if any precondition is not satisfied.
 */
export async function initIndexingSetup(): Promise<void> {
  try {
    // TODO: wait for ENSDb instance to be healthy
    const { migrateEnsNodeSchema } = await import("@/lib/ensdb/migrate-ensnode-schema");
    // Ensure the ENSNode Schema in ENSDb is up to date by running any pending migrations.
    await migrateEnsNodeSchema();
  } catch (error) {
    // If any error happens during the initialization of indexing of onchain events,
    // we want to log the error and exit the process with a non-zero exit code,
    // since this is a critical failure that prevents the ENSIndexer instance from functioning properly.
    logger.error({
      msg: "Failed to initialize the indexing setup",
      module: "init-indexing-setup",
      error,
    });

    process.exitCode = 1;
    throw error;
  }
}
