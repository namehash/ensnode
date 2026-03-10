import config from "@/config";

import { type EnsRainbow, EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { EnsRainbowClientWithRetry } from "@/lib/ensrainbow-client-with-retry";

/**
 * Get an {@link EnsRainbow.ApiClient} instance with retry-on-heal.
 */
export function getENSRainbowApiClient(): EnsRainbow.ApiClient {
  const ensRainbowApiClient = new EnsRainbowApiClient({
    endpointUrl: config.ensRainbowUrl,
    labelSet: config.labelSet,
  });

  if (
    ensRainbowApiClient.getOptions().endpointUrl ===
    EnsRainbowApiClient.defaultOptions().endpointUrl
  ) {
    console.warn(
      `Using default public ENSRainbow server which may cause increased network latency. For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.`,
    );
  }

  return new EnsRainbowClientWithRetry(ensRainbowApiClient);
}
