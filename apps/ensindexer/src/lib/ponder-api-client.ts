import config from "@/config";

import pRetry from "p-retry";

import { LocalPonderClient } from "@/ponder/api/lib/local-ponder-client";

let localPonderClient: LocalPonderClient;

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
  if (localPonderClient) {
    return localPonderClient;
  }

  // Initialize the LocalPonderClient with retries in case of failure,
  // such as if the Ponder app is not yet ready to accept connections.
  localPonderClient = await pRetry(() => LocalPonderClient.init(config.ensIndexerUrl), {
    retries: 3,
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      console.warn(
        `Initializing local Ponder client attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
      );
    },
  });

  return localPonderClient;
}
