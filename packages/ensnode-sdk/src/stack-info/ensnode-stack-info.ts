import type { EnsApiPublicConfig } from "../ensapi/config/types";
import type { EnsDbPublicConfig } from "../ensdb/config";
import type { EnsIndexerPublicConfig } from "../ensindexer/config/types";
import type { EnsRainbowPublicConfig } from "../ensrainbow/config";

/**
 * Information about the stack of services inside an ENSNode instance.
 */
export interface EnsNodeStackInfo {
  /**
   * ENSApi Public Config
   */
  ensApi: EnsApiPublicConfig;

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
   *
   * If undefined, represents that ENSRainbow is currently undergoing
   * a cold start and may take up to an hour to become ready.
   */
  ensRainbow?: EnsRainbowPublicConfig;
}

/**
 * Build a complete {@link EnsNodeStackInfo} object from
 * the given public configs of ENSApi and ENSDb.
 */
export function buildEnsNodeStackInfo(
  ensApiPublicConfig: EnsApiPublicConfig,
  ensDbPublicConfig: EnsDbPublicConfig,
): EnsNodeStackInfo {
  return {
    ensApi: ensApiPublicConfig,
    ensDb: ensDbPublicConfig,
    ensIndexer: ensApiPublicConfig.ensIndexerPublicConfig,
    ensRainbow: ensApiPublicConfig.ensIndexerPublicConfig.ensRainbowPublicConfig,
  };
}
