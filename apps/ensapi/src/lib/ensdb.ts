import { secondsToMilliseconds } from "date-fns";
import pRetry from "p-retry";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";

import logger from "@/lib/logger";

/**
 * Wait for ENSDb to be ready
 *
 * Blocks execution until the ENSDb instance is ready to serve queries.
 *
 * Note: It may take several minutes for the ENSDb instance to become ready in
 * a cold start scenario. We use retries with a fixed interval between attempts
 * for the ENSDb readiness check to allow for ample time for ENSDb to
 * become ready.
 *
 * @throws When ENSDb fails to become ready after all configured retry attempts.
 *         This error will trigger termination of the ENSApi process.
 */
export async function waitForEnsDbToBeReady(ensDbClient: EnsDbReader): Promise<void> {
  const { ensIndexerSchemaName } = ensDbClient;
  logger.info({ ensIndexerSchemaName }, `Waiting for ENSDb instance to be ready`);

  return pRetry(
    async () => {
      const isEnsDbInstanceReady = await ensDbClient.isReady();

      if (!isEnsDbInstanceReady) {
        throw new Error("ENSDb instance is not ready yet.");
      }
    },
    {
      retries: 15, // This allows for a total of over 15 minutes of retries with 1 minute between attempts.
      minTimeout: secondsToMilliseconds(60),
      maxTimeout: secondsToMilliseconds(60),
      onFailedAttempt: ({ attemptNumber, retriesLeft, error }) => {
        logger.warn(
          {
            ensIndexerSchemaName,
            attempt: attemptNumber,
            retriesLeft,
            err: error,
            advice: `This might be due to ENSDb instance having a cold start, which can take several minutes.`,
          },
          `ENSDb instance readiness check failed`,
        );
      },
    },
  )
    .then(() => {
      logger.info({ ensIndexerSchemaName }, `ENSDb instance is ready`);
    })
    .catch((err) => {
      logger.error(
        { ensIndexerSchemaName, err },
        `ENSDb readiness check failed after multiple attempts`,
      );

      // Throw the error to terminate the ENSApi process due to the failed readiness check of a critical dependency
      throw err;
    });
}
