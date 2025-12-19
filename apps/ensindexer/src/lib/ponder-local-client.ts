import config from "@/config";

import pRetry from "p-retry";

import { PonderClient, PonderHealthCheckResults } from "@ensnode/ponder-sdk";

/**
 * How many times retries should be attempted before
 * {@link waitForPonderApplicationToBecomeHealthy} becomes
 * a rejected promise.
 */
export const MAX_PONDER_APPLICATION_HEALTHCHECK_ATTEMPTS = 5;

export const ponderClient = new PonderClient(config.ensIndexerUrl);

export const waitForPonderApplicationToBecomeHealthy = pRetry(
  async () => {
    const response = await ponderClient.health();

    if (response !== PonderHealthCheckResults.Ok) {
      throw new Error("Ponder application is not healthy yet");
    }
  },
  {
    retries: MAX_PONDER_APPLICATION_HEALTHCHECK_ATTEMPTS,
  },
);
