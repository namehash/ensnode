import type { EnsApiPublicConfig } from "../ensapi/config/types";
import type { EnsDbPublicConfig } from "../ensdb/config";
import type { EnsIndexerPublicConfig } from "../ensindexer/config/types";
import type { EnsRainbowPublicConfig } from "../ensrainbow";
import { buildEnsDbStackInfo, type EnsDbStackInfo } from "./ensdb-stack-info";

/**
 * Information about the stack of services inside an ENSNode instance.
 */
export interface EnsNodeStackInfo extends EnsDbStackInfo {
  /**
   * ENSApi Public Config
   */
  ensApi: EnsApiPublicConfig;
}

/**
 * Build a complete {@link EnsNodeStackInfo} object from
 * the given public configs of ENSApi, ENSDb, ENSIndexer, and ENSRainbow.
 */
export function buildEnsNodeStackInfo(
  ensApiPublicConfig: EnsApiPublicConfig,
  ensDbPublicConfig: EnsDbPublicConfig,
  ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ensRainbowPublicConfig: EnsRainbowPublicConfig,
): EnsNodeStackInfo {
  return {
    ...buildEnsDbStackInfo(ensDbPublicConfig, ensIndexerPublicConfig, ensRainbowPublicConfig),
    ensApi: ensApiPublicConfig,
  };
}
