import { UrlString } from "@ensnode/ensnode-sdk";
import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

// Cache to store client instances by URL
const clientCache = new Map<UrlString, EnsRainbowApiClient>();

/**
 * Get a {@link EnsRainbowApiClient} instance for requested endpoint URL.
 *
 * Note: calling this function more than one with the same endpoint URL
 * will always return the same {@link EnsRainbowApiClient} instance in
 * order to leverage caching.
 */
export function getENSRainbowApiCLient(ensRainbowEndpointUrl: URL) {
  if (clientCache.has(ensRainbowEndpointUrl.href)) {
    return clientCache.get(ensRainbowEndpointUrl.href)!;
  }

  const ensRainbowApiClient = new EnsRainbowApiClient({
    endpointUrl: new URL(ensRainbowEndpointUrl),
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

  // Cache the client before returning
  clientCache.set(ensRainbowEndpointUrl.href, ensRainbowApiClient);

  if (clientCache.size !== 1) {
    console.warn(
      `More than one EnsRainbowApiClient instance is in use.
For production, make sure to only use a single instance in order to use
client caching effectively.`,
    );
  }

  return ensRainbowApiClient;
}
