import type { EnsDbPublicConfig } from "../ensdb/config";
import type { EnsIndexerPublicConfig } from "../ensindexer/config";
import type { EnsRainbowPublicConfig } from "../ensrainbow/config";
import { validateEnsIndexerStackInfo } from "./validate/ensindexer-stack-info";

/**
 * Information about the stack of services inside an ENSIndexer instance.
 */
export interface EnsIndexerStackInfo {
  /**
   * ENSDb Public Config
   */
  ensDb: EnsDbPublicConfig;

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
 * the given public configs of ENSDb, ENSIndexer, and ENSRainbow.
 */
export function buildEnsIndexerStackInfo(
  ensDbPublicConfig: EnsDbPublicConfig,
  ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ensRainbowPublicConfig: EnsRainbowPublicConfig,
): EnsIndexerStackInfo {
  return validateEnsIndexerStackInfo({
    ensDb: ensDbPublicConfig,
    ensIndexer: ensIndexerPublicConfig,
    ensRainbow: ensRainbowPublicConfig,
  });
}
