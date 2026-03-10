import config from "@/config";

import {
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  validateEnsIndexerPublicConfig,
  validateEnsIndexerVersionInfo,
} from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { getEnsIndexerVersion, getNodeJsVersion, getPackageVersion } from "@/lib/version-info";

export class PublicConfigBuilder {
  /**
   * ENSRainbow Client
   *
   * Used to fetch ENSRainbow Public Config, which is part of
   * the ENSIndexer Public Config.
   */
  private ensRainbowClient: EnsRainbow.ApiClient;

  /**
   * Immutable ENSIndexer Public Config
   *
   * The cached ENSIndexer Public Config object, which is built and validated
   * on the first call to `getPublicConfig()`, and returned as-is on subsequent calls.
   */
  private immutablePublicConfig: EnsIndexerPublicConfig | undefined;

  /**
   * @param ensRainbowClient ENSRainbow Client instance used to fetch ENSRainbow Public Config
   */
  constructor(ensRainbowClient: EnsRainbow.ApiClient) {
    this.ensRainbowClient = ensRainbowClient;
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
      const [versionInfo, ensRainbowPublicConfig] = await Promise.all([
        this.getEnsIndexerVersionInfo(),
        this.ensRainbowClient.config(),
      ]);

      this.immutablePublicConfig = validateEnsIndexerPublicConfig({
        databaseSchemaName: config.databaseSchemaName,
        ensRainbowPublicConfig,
        labelSet: config.labelSet,
        indexedChainIds: config.indexedChainIds,
        isSubgraphCompatible: config.isSubgraphCompatible,
        namespace: config.namespace,
        plugins: config.plugins,
        versionInfo,
      });
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
