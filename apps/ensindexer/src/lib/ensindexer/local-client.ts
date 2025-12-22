import config from "@/config";

import pRetry from "p-retry";

import { EnsIndexerClient, EnsIndexerHealthCheckResults } from "@ensnode/ensnode-sdk";

/**
 * How many times retries should be attempted before
 * {@link waitForEnsIndexerToBecomeHealthy} becomes a rejected promise.
 */
export const MAX_ENSINDEXER_HEALTHCHECK_ATTEMPTS = 5;

export const ensIndexerClient = new EnsIndexerClient(config.ensIndexerUrl);

/**
 * Wait for ENSIndexer to become healthy.
 *
 * The global promise that will only resolve after the ENSIndexer has become healthy.
 */
export const waitForEnsIndexerToBecomeHealthy = pRetry(
  async () => {
    const response = await ensIndexerClient.health();

    if (response !== EnsIndexerHealthCheckResults.Ok) {
      throw new Error("ENSIndexer is not healthy yet");
    }
  },
  {
    retries: MAX_ENSINDEXER_HEALTHCHECK_ATTEMPTS,
  },
);
