import config from "@/config";

import pRetry from "p-retry";

import { EnsIndexerClient } from "./client";

export const ensIndexerClient = new EnsIndexerClient(config.ensIndexerUrl);

/**
 * Wait for ENSIndexer to become healthy.
 *
 * The global promise that will only resolve after the ENSIndexer has become healthy.
 */
export const waitForEnsIndexerToBecomeHealthy = pRetry(async () => ensIndexerClient.health(), {
  retries: 5,
});
