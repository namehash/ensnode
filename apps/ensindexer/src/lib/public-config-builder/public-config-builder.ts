import config from "@/config";

import {
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  validateEnsIndexerPublicConfig,
  validateEnsIndexerVersionInfo,
} from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { getEnsIndexerVersion, getPackageVersion } from "@/lib/version-info";

export class PublicConfigBuilder {
  /**
   * ENSRainbow Client
   *
   * Used to fetch ENSRainbow Public Config, which is part of
   * the ENSIndexer Public Config.
   */
  private ensRainbowClient: EnsRainbow.ApiClient;

  /**
   * One-time async readiness hook awaited before the first
   * `ensRainbowClient.config()` invocation, so callers don't race ENSRainbow's
   * background bootstrap. Defaults to a no-op for callers that don't need to
   * gate on readiness (e.g. tests or environments where ENSRainbow is already
   * known to be ready).
   */
  private waitForEnsRainbowReady: () => Promise<void>;

  /**
   * Immutable ENSIndexer Public Config
   *
   * The cached ENSIndexer Public Config object, which is built and validated
   * on the first call to `getPublicConfig()`, and returned as-is on subsequent calls.
   */
  private immutablePublicConfig: EnsIndexerPublicConfig | undefined;

  /**
   * @param ensRainbowClient ENSRainbow Client instance used to fetch ENSRainbow Public Config
   * @param waitForEnsRainbowReady One-time async readiness hook awaited before the first
   *        `ensRainbowClient.config()` invocation. Defaults to a no-op.
   */
  constructor(
    ensRainbowClient: EnsRainbow.ApiClient,
    waitForEnsRainbowReady: () => Promise<void> = async () => {},
  ) {
    this.ensRainbowClient = ensRainbowClient;
    this.waitForEnsRainbowReady = waitForEnsRainbowReady;
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
      await this.waitForEnsRainbowReady();

      const [versionInfo, ensRainbowPublicConfig] = await Promise.all([
        this.getEnsIndexerVersionInfo(),
        this.ensRainbowClient.config(),
      ]);

      this.immutablePublicConfig = validateEnsIndexerPublicConfig({
        ensIndexerSchemaName: config.ensIndexerSchemaName,
        ensRainbowPublicConfig,
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
      ensDb: ensDbVersion,
      ensIndexer: ensIndexerVersion,
      ensNormalize: getPackageVersion("@adraffy/ens-normalize"),
    });
  }
}
