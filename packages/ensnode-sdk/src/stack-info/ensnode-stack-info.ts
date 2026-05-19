import type { EnsApiPublicConfig } from "../ensapi/config";
import type { EnsDbPublicConfig } from "../ensdb/config";
import type { EnsIndexerPublicConfig } from "../ensindexer/config";
import type { EnsRainbowPublicConfig } from "../ensrainbow";
import { buildEnsIndexerStackInfo, type EnsIndexerStackInfo } from "./ensindexer-stack-info";
import { validateEnsNodeStackInfo } from "./validate/ensnode-stack-info";

/**
 * Information about the stack of services inside an ENSNode instance.
 */
export interface EnsNodeStackInfo extends EnsIndexerStackInfo {
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
  return validateEnsNodeStackInfo({
    ...buildEnsIndexerStackInfo(ensDbPublicConfig, ensIndexerPublicConfig, ensRainbowPublicConfig),
    ensApi: ensApiPublicConfig,
  });
}
