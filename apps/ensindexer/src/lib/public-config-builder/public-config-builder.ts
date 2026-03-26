import config from "@/config";

import {
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  type EnsRainbowPublicConfig,
  validateEnsIndexerPublicConfig,
  validateEnsIndexerVersionInfo,
} from "@ensnode/ensnode-sdk";

import type { EnsRainbowPublicConfigCache } from "@/cache/ensrainbow-public-config";
import { getEnsIndexerVersion, getNodeJsVersion, getPackageVersion } from "@/lib/version-info";

export class PublicConfigBuilder {
  private ensRainbowPublicConfigCache: EnsRainbowPublicConfigCache;

  /**
   * Immutable ENSIndexer Public Config
   *
   * The cached ENSIndexer Public Config object, which is built and validated
   * on the first call to `getPublicConfig()`, and returned as-is on subsequent calls.
   */
  private immutablePublicConfig: EnsIndexerPublicConfig | undefined;

  /**
   * @param ensRainbowPublicConfigCache ENSRainbow Public Config Cache instance used to fetch ENSRainbow Public Config
   */
  constructor(ensRainbowPublicConfigCache: EnsRainbowPublicConfigCache) {
    this.ensRainbowPublicConfigCache = ensRainbowPublicConfigCache;
  }

  /**
   * Get ENSIndexer Public Config
   *
   * Note: ENSIndexer Public Config is cached after the first call, so
   * subsequent calls will return the cached version without rebuilding it.
   *
   * @throws if the built ENSIndexer Public Config does not conform to
   *         the expected schema
   */
  async getPublicConfig(): Promise<EnsIndexerPublicConfig> {
    if (typeof this.immutablePublicConfig === "undefined") {
      const versionInfo = this.getEnsIndexerVersionInfo();

      const cachedEnsRainbowPublicConfig = await this.ensRainbowPublicConfigCache.read();

      let ensRainbowPublicConfig: EnsRainbowPublicConfig | undefined;

      if (!(cachedEnsRainbowPublicConfig instanceof Error)) {
        ensRainbowPublicConfig = cachedEnsRainbowPublicConfig;
      }

      const ensIndexerPublicConfig = validateEnsIndexerPublicConfig({
        databaseSchemaName: config.databaseSchemaName,
        ensRainbowPublicConfig,
        labelSet: config.labelSet,
        indexedChainIds: config.indexedChainIds,
        isSubgraphCompatible: config.isSubgraphCompatible,
        namespace: config.namespace,
        plugins: config.plugins,
        versionInfo,
      });

      if (typeof ensRainbowPublicConfig === "undefined") {
        // Do not cache the `ensIndexerPublicConfig` if `ensRainbowPublicConfig` remains undefined.
        return ensIndexerPublicConfig;
      }

      // Only cache the `ensIndexerPublicConfig` if `ensRainbowPublicConfig` was successfully loaded from cache.
      this.immutablePublicConfig = ensIndexerPublicConfig;
    }

    return this.immutablePublicConfig;
  }

  /**
   * Get ENSIndexer Version Info
   *
   * @throws if the built ENSIndexer Version Info does not conform to
   *         the expected schema.
   */
  private getEnsIndexerVersionInfo(): EnsIndexerVersionInfo {
    // ENSIndexer version
    const ensIndexerVersion = getEnsIndexerVersion();

    // ENSDb version
    // ENSDb version is always the same as the ENSIndexer version number
    const ensDbVersion = ensIndexerVersion;

    return validateEnsIndexerVersionInfo({
      nodejs: getNodeJsVersion(),
      ponder: getPackageVersion("ponder"),
      ensDb: ensDbVersion,
      ensIndexer: ensIndexerVersion,
      ensNormalize: getPackageVersion("@adraffy/ens-normalize"),
    });
  }
}
