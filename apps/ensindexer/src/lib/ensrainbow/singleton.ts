import config from "@/config";

import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

const { ensRainbowUrl, labelSet } = config;

if (ensRainbowUrl === EnsRainbowApiClient.defaultOptions().endpointUrl) {
  console.warn(
    `Using default public ENSRainbow server which may cause increased network latency. For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.`,
  );
}

/**
 * Singleton ENSRainbow API Client instance for ENSIndexer app.
 */
export const ensRainbowClient = new EnsRainbowApiClient({
  endpointUrl: ensRainbowUrl,
  labelSet,
});
