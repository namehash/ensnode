import config from "@/config";

import pRetry from "p-retry";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

const { ensRainbowUrl, labelSet } = config;

if (ensRainbowUrl === EnsRainbowApiClient.defaultOptions().endpointUrl) {
  console.warn(
    `Using default public ENSRainbow server which may cause increased network latency. For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.`,
  );
}

export const ensRainbowClient = new EnsRainbowApiClient({
  endpointUrl: ensRainbowUrl,
  labelSet,
});

export const waitForEnsRainbowHealthy = pRetry(async () => ensRainbowClient.health(), {
  retries: 12,
  onFailedAttempt({ error, attemptNumber, retriesLeft }) {
    console.warn(
      `Attempt ${attemptNumber} to connect to ENSRainbow failed: ${error.message}. ${retriesLeft} retries left.`,
    );
  },
});
