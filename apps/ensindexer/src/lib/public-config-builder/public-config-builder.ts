import config from "@/config";

import {
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  validateEnsIndexerPublicConfig,
  validateEnsIndexerVersionInfo,
} from "@ensnode/ensnode-sdk";

import {
  getEnsIndexerCommitRef,
  getEnsIndexerVersion,
  getPackageVersion,
} from "@/lib/version-info";

export class PublicConfigBuilder {
  /**
   * Immutable ENSIndexer Public Config
   *
   * The cached ENSIndexer Public Config object, which is built and validated
   * on the first call to `getPublicConfig()`, and returned as-is on subsequent calls.
   */
  private immutablePublicConfig: EnsIndexerPublicConfig | undefined;

  /**
   * Get ENSIndexer Public Config
   *
   * Note: The {@link EnsIndexerPublicConfig} object is immutable for
   * the whole ENSIndexer instance lifecycle. Therefore, the result of
   * the first {@link getPublicConfig} call is cached and returned for
   * subsequent calls.
   *
   * @throws if the built {@link EnsIndexerPublicConfig} does not conform to
   *         the expected schema
   */
  getPublicConfig(): EnsIndexerPublicConfig {
    if (typeof this.immutablePublicConfig === "undefined") {
      const versionInfo = this.getEnsIndexerVersionInfo();

      this.immutablePublicConfig = validateEnsIndexerPublicConfig({
        ensIndexerSchemaName: config.ensIndexerSchemaName,
        clientLabelSet: config.clientLabelSet,
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
      ponder: getPackageVersion("ponder"),
      commit: getEnsIndexerCommitRef(),
      ensDb: ensDbVersion,
      ensIndexer: ensIndexerVersion,
      ensNormalize: getPackageVersion("@adraffy/ens-normalize"),
    });
  }
}
