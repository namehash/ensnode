import config from "@/config";
import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

/**
 * Get a {@link EnsRainbowApiClient} instance.
 */
export function getENSRainbowApiClient() {
  const ensRainbowApiClient = new EnsRainbowApiClient({
    endpointUrl: config.ensRainbowUrl,
    labelSet: config.labelSet,
  });

  if (
    ensRainbowApiClient.getOptions().endpointUrl ===
    EnsRainbowApiClient.defaultOptions().endpointUrl
  ) {
    console.warn(
      `Using default public ENSRainbow server which may cause increased network latency.
For production, use your own ENSRainbow server that runs on the same network
as the ENSIndexer server.`,
    );
  }

  return ensRainbowApiClient;
}
