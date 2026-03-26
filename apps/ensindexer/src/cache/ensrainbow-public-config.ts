import { minutesToSeconds } from "date-fns/minutesToSeconds";

import { type EnsRainbowPublicConfig, SWRCache } from "@ensnode/ensnode-sdk";

import { ensRainbowClient } from "@/lib/ensrainbow/singleton";

export type EnsRainbowPublicConfigCache = SWRCache<EnsRainbowPublicConfig>;

async function loadEnsRainbowPublicConfig(): Promise<EnsRainbowPublicConfig> {
  const ensRainbowPublicConfig = await ensRainbowClient.config();

  return ensRainbowPublicConfig;
}

export const ensRainbowPublicConfigCache = new SWRCache<EnsRainbowPublicConfig>({
  fn: loadEnsRainbowPublicConfig,
  ttl: Number.POSITIVE_INFINITY,
  errorTtl: minutesToSeconds(1),
  proactiveRevalidationInterval: undefined,
  proactivelyInitialize: true,
}) satisfies EnsRainbowPublicConfigCache;
