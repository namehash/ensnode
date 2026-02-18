import config from "@/config";

import pRetry from "p-retry";

import { LocalPonderClient } from "@/ponder/api/lib/local-ponder-client";

let localPonderClientPromise: Promise<LocalPonderClient>;

/**
 * Get the singleton LocalPonderClient instance for the ENSIndexer app.
 *
 * This function initializes the LocalPonderClient on the first call by
 * connecting to the local Ponder app and fetching the necessary data to
 * build the client's state. The initialized client is cached and returned
 * on subsequent calls.
 *
 * @returns The singleton LocalPonderClient instance.
 * @throws Error if the client fails to initialize after
 *         the specified number of retries.
 */
export async function getLocalPonderClient(): Promise<LocalPonderClient> {
  // Return the cached client instance if it has already been initialized.
  if (localPonderClientPromise) {
    return localPonderClientPromise;
  }

  // Initialize the LocalPonderClient in a non-blocking way.
  // Apply retries in case of failure, for example, if the Ponder app is
  // not yet ready to accept connections.
  /**
   * Initialize the LocalPonderClient by connecting to the local Ponder app and
   * fetching necessary data to build the client's state. This operation is
   * retried up to 3 times in case of failure, with a warning logged on each
   * failed attempt.
   *
   * @returns The initialized LocalPonderClient instance.
   * @throws Error if the client fails to initialize after the specified number of retries.
   */
  localPonderClientPromise = pRetry(() => LocalPonderClient.init(config.ensIndexerUrl), {
    retries: 3,

    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      console.warn(
        `Initializing local Ponder client attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
      );
    },
  }).catch((error) => {
    console.error(
      `Failed to initialize LocalPonderClient after multiple attempts: ${error.message}`,
    );

    // Signal termination of the process with a non-zero exit code to indicate failure.
    process.exitCode = 1;

    throw error;
  });

  return localPonderClientPromise;
}
