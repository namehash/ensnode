import config from "@/config";

import pRetry from "p-retry";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

const { ensRainbowUrl, labelSet } = config;

if (ensRainbowUrl.href === EnsRainbowApiClient.defaultOptions().endpointUrl.href) {
  console.warn(
    `Using default public ENSRainbow server which may cause increased network latency. For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.`,
  );
}

/**
 * Singleton ENSRainbow Client instance for ENSIndexer app.
 */
export const ensRainbowClient = new EnsRainbowApiClient({
  endpointUrl: ensRainbowUrl,
  labelSet,
});

/**
 * Cached promise for waiting for ENSRainbow to be ready.
 *
 * This ensures that multiple concurrent calls to
 * {@link waitForEnsRainbowToBeReady} will share the same underlying promise
 * in order to use the same retry sequence.
 */
let waitForEnsRainbowToBeReadyPromise: Promise<void> | undefined;

/**
 * Wait for ENSRainbow to be ready
 *
 * Blocks execution until the ENSRainbow instance is ready to serve requests.
 *
 * Note: It may take 30+ minutes for the ENSRainbow instance to become ready in
 * a cold start scenario. We use retries for the ENSRainbow health check with
 * an exponential backoff strategy to handle this.
 *
 * @throws When ENSRainbow fails to become ready after all configured retry attempts.
 *         This error will trigger termination of the ENSIndexer process.
 */
export function waitForEnsRainbowToBeReady(): Promise<void> {
  if (waitForEnsRainbowToBeReadyPromise) {
    return waitForEnsRainbowToBeReadyPromise;
  }

  console.log(`Waiting for ENSRainbow instance to be ready at '${ensRainbowUrl}'...`);

  waitForEnsRainbowToBeReadyPromise = pRetry(async () => ensRainbowClient.health(), {
    retries: 12, // This allows for a total of over 1 hour of retries with the exponential backoff strategy
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      console.log(
        `ENSRainbow health check attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
      );
    },
  })
    .then(() => console.log(`ENSRainbow instance is ready at '${ensRainbowUrl}'.`))
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      console.error(`ENSRainbow health check failed after multiple attempts: ${errorMessage}`);

      // Throw the error to terminate the ENSIndexer process due to failed health check of critical dependency
      throw new Error(errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    });

  return waitForEnsRainbowToBeReadyPromise;
}
