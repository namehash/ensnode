import config from "@/config";

import { secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { logger } from "@/lib/logger";

const { ensRainbowUrl, labelSet } = config;

if (ensRainbowUrl.href === EnsRainbowApiClient.defaultOptions().endpointUrl.href) {
  logger.warn({
    msg: `Using default public ENSRainbow server which may cause increased network latency`,
    advice: `For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.`,
  });
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
 * a cold start scenario. We use retries with a fixed interval between attempts
 * for the ENSRainbow health check to allow for ample time for ENSRainbow to
 * become ready.
 *
 * @throws When ENSRainbow fails to become ready after all configured retry attempts.
 *         This error will trigger termination of the ENSIndexer process.
 */
export function waitForEnsRainbowToBeReady(): Promise<void> {
  if (waitForEnsRainbowToBeReadyPromise) {
    return waitForEnsRainbowToBeReadyPromise;
  }

  logger.info({
    msg: `Waiting for ENSRainbow instance to be ready`,
    ensRainbowInstance: ensRainbowUrl.href,
  });

  waitForEnsRainbowToBeReadyPromise = pRetry(async () => ensRainbowClient.health(), {
    retries: 60, // This allows for a total of over 1 hour of retries with 1 minute between attempts.
    minTimeout: secondsToMilliseconds(60),
    maxTimeout: secondsToMilliseconds(60),
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      logger.warn({
        msg: `ENSRainbow health check failed`,
        attempt: attemptNumber,
        retriesLeft,
        error: retriesLeft === 0 ? error : undefined,
        ensRainbowInstance: ensRainbowUrl.href,
        advice: `This might be due to ENSRainbow having a cold start, which can take 30+ minutes.`,
      });
    },
  })
    .then(() => {
      logger.info({
        msg: `ENSRainbow instance is ready`,
        ensRainbowInstance: ensRainbowUrl.href,
      });
    })
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error({
        msg: `ENSRainbow health check failed after multiple attempts`,
        error,
        ensRainbowInstance: ensRainbowUrl.href,
      });

      // Throw the error to terminate the ENSIndexer process due to the failed health check of a critical dependency
      throw new Error(errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    });

  return waitForEnsRainbowToBeReadyPromise;
}
