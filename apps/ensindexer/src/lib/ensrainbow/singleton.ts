import config from "@/config";

import { secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import { EnsRainbowApiClient, EnsRainbowHttpError } from "@ensnode/ensrainbow-sdk";

import { logger } from "@/lib/logger";

const { ensRainbowUrl, clientLabelSet } = config;

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
  clientLabelSet,
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
 * Determine whether a readiness-check failure should be retried.
 *
 * Retry policy:
 * - HTTP 503 (`ServiceUnavailable`) — ENSRainbow is still bootstrapping. Retryable.
 * - Any other `EnsRainbowHttpError` (e.g. 404, 500) — almost certainly indicates a
 *   misconfigured `ENSRAINBOW_URL`, a broken instance, or routing/ingress issue. These do
 *   not fix themselves over the course of an hour, so we abort fast to surface the
 *   configuration/outage problem instead of stalling startup for ~60 minutes.
 * - Anything else (network errors like `ECONNREFUSED`/DNS failures, JSON parse errors,
 *   etc.) — retryable. These are common during cold start, before the ENSRainbow HTTP
 *   server has bound its port.
 *
 * Exported for testing.
 */
export function shouldRetryReadinessCheck(error: unknown): boolean {
  if (error instanceof EnsRainbowHttpError) {
    return error.status === 503;
  }
  return true;
}

/**
 * Wait for ENSRainbow to be ready
 *
 * Blocks execution until the ENSRainbow instance is ready to serve requests.
 *
 * Note: It may take 30+ minutes for the ENSRainbow instance to become ready in
 * a cold start scenario. We use retries with a fixed interval between attempts
 * for the ENSRainbow readiness check to allow for ample time for bootstrap to
 * complete.
 *
 * Non-503 HTTP failures (e.g. 404 misrouting, 500 server errors) abort retries
 * immediately via {@link shouldRetryReadinessCheck}, so configuration/outage
 * problems surface quickly instead of being masked by an hour of retries.
 *
 * @throws When ENSRainbow fails to become ready after all configured retry attempts,
 *         or as soon as a non-retryable error (e.g. non-503 HTTP status) is encountered.
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

  waitForEnsRainbowToBeReadyPromise = pRetry(async () => ensRainbowClient.ready(), {
    retries: 60, // This allows for a total of over 1 hour of retries with 1 minute between attempts.
    minTimeout: secondsToMilliseconds(60),
    maxTimeout: secondsToMilliseconds(60),
    shouldRetry: ({ error }) => shouldRetryReadinessCheck(error),
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      const willAbort = !shouldRetryReadinessCheck(error);
      const isHttpError = error instanceof EnsRainbowHttpError;
      logger.warn({
        msg: willAbort
          ? `ENSRainbow readiness check failed with a non-retryable error; aborting retries`
          : `ENSRainbow readiness check failed`,
        attempt: attemptNumber,
        retriesLeft,
        // Always surface the error on abort or final attempt; otherwise keep logs concise.
        error: willAbort || retriesLeft === 0 ? error : undefined,
        httpStatus: isHttpError ? error.status : undefined,
        ensRainbowInstance: ensRainbowUrl.href,
        advice: willAbort
          ? `This usually indicates a misconfigured ENSRAINBOW_URL, a broken ENSRainbow instance, or an ingress/routing issue. Verify the URL points at a healthy ENSRainbow server.`
          : `This might be due to ENSRainbow still bootstrapping its database, which can take 30+ minutes during a cold start.`,
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
      const isHttpError = error instanceof EnsRainbowHttpError;
      const isAbort = isHttpError && error.status !== 503;

      logger.error({
        msg: isAbort
          ? `ENSRainbow readiness check aborted due to non-retryable HTTP error`
          : `ENSRainbow readiness check failed after multiple attempts`,
        error,
        httpStatus: isHttpError ? error.status : undefined,
        ensRainbowInstance: ensRainbowUrl.href,
      });

      // Throw the error to terminate the ENSIndexer process due to the failed readiness check of a critical dependency
      throw new Error(errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    });

  return waitForEnsRainbowToBeReadyPromise;
}
