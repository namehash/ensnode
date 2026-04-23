import type { EnsDbPublicConfig } from "../ensdb/config";
import type { EnsIndexerPublicConfig } from "../ensindexer/config/types";
import type { EnsRainbowPublicConfig } from "../ensrainbow/config";
import { buildEnsIndexerStackInfo, type EnsIndexerStackInfo } from "./ensindexer-stack-info";

/**
 * Information about the stack of services inside an ENSDb instance.
 */
export interface EnsDbStackInfo extends EnsIndexerStackInfo {
  /**
   * ENSDb Public Config
   */
  ensDb: EnsDbPublicConfig;
}

/**
 * Build a complete {@link EnsDbStackInfo} object from
 * the given public configs of ENSDb, ENSIndexer, and ENSRainbow.
 */
export function buildEnsDbStackInfo(
  ensDbPublicConfig: EnsDbPublicConfig,
  ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ensRainbowPublicConfig: EnsRainbowPublicConfig,
): EnsDbStackInfo {
  return {
    ...buildEnsIndexerStackInfo(ensIndexerPublicConfig, ensRainbowPublicConfig),
    ensDb: ensDbPublicConfig,
  };
}
