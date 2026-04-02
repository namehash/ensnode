import config from "@/config";

import { type EnsRainbow, EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { formatLogParam, logger } from "@/lib/logger";

export function getENSRainbowApiClient(): EnsRainbow.ApiClient {
  const ensRainbowApiClient = new EnsRainbowApiClient({
    endpointUrl: config.ensRainbowUrl,
    labelSet: config.labelSet,
  });

  if (
    ensRainbowApiClient.getOptions().endpointUrl ===
    EnsRainbowApiClient.defaultOptions().endpointUrl
  ) {
    logger.warn({
      msg: `Using default public ENSRainbow server which may cause increased network latency`,
      advice: formatLogParam(
        "For production, use your own ENSRainbow server that runs on the same network as the ENSIndexer server.",
      ),
    });
  }

  return ensRainbowApiClient;
}
