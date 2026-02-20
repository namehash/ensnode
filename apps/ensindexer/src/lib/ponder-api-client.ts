import config from "@/config";

import { LocalPonderClient } from "@/ponder/api/lib/local-ponder-client";

let localPonderClient: LocalPonderClient | undefined;

/**
 * Get the singleton LocalPonderClient instance for the ENSIndexer app.
 *
 * This function relies on SWR caches with proactive revalidation to load
 * necessary data for the client state, allowing the client to be initialized
 * in a non-blocking way.
 *
 * @returns The singleton LocalPonderClient instance.
 */
export function getLocalPonderClient(): LocalPonderClient {
  // Initialize the singleton LocalPonderClient instance if it hasn't been
  // initialized yet.
  if (localPonderClient === undefined) {
    localPonderClient = new LocalPonderClient(config.ensIndexerUrl, config.indexedChainIds);
  }

  return localPonderClient;
}
