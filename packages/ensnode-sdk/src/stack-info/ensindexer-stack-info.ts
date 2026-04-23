import type { EnsIndexerPublicConfig } from "../ensindexer/config/types";
import type { EnsRainbowPublicConfig } from "../ensrainbow/config";

/**
 * Information about the stack of services inside an ENSIndexer instance.
 */
export interface EnsIndexerStackInfo {
  /**
   * ENSIndexer Public Config
   */
  ensIndexer: EnsIndexerPublicConfig;

  /**
   * ENSRainbow Public Config
   */
  ensRainbow: EnsRainbowPublicConfig;
}

/**
 * Build a complete {@link EnsIndexerStackInfo} object from
 * the given public configs of ENSIndexer and ENSRainbow.
 */
export function buildEnsIndexerStackInfo(
  ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ensRainbowPublicConfig: EnsRainbowPublicConfig,
): EnsIndexerStackInfo {
  return {
    ensIndexer: ensIndexerPublicConfig,
    ensRainbow: ensRainbowPublicConfig,
  };
}
