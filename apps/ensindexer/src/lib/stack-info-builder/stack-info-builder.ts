import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import { buildEnsIndexerStackInfo, type EnsIndexerStackInfo } from "@ensnode/ensnode-sdk";
import type { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk/client";

import type { PublicConfigBuilder } from "@/lib/public-config-builder";

export class StackInfoBuilder {
  /**
   * Immutable {@link EnsIndexerStackInfo}
   *
   * The cached {@link EnsIndexerStackInfo} object, which is built and validated
   * on the first call to `getStackInfo()`, and returned as-is on subsequent calls.
   */
  private immutableStackInfo: EnsIndexerStackInfo | undefined;

  constructor(
    private readonly ensDbClient: EnsDbReader,
    private readonly ensRainbowClient: EnsRainbowApiClient,
    private readonly publicConfigBuilder: PublicConfigBuilder,
  ) {}

  /**
   * Get ENSIndexer Stack Info
   *
   * Note: ENSIndexer Stack Info is cached after the first call, so
   * subsequent calls will return the cached version without rebuilding it.
   *
   * @throws if the built ENSIndexer Stack Info does not conform to
   *         the expected schema
   */
  async getStackInfo(): Promise<EnsIndexerStackInfo> {
    if (typeof this.immutableStackInfo === "undefined") {
      const [ensDbPublicConfig, ensIndexerPublicConfig, ensRainbowPublicConfig] = await Promise.all(
        [
          this.ensDbClient.buildEnsDbPublicConfig(),
          this.publicConfigBuilder.getPublicConfig(),
          this.ensRainbowClient.config(),
        ],
      );

      this.immutableStackInfo = buildEnsIndexerStackInfo(
        ensDbPublicConfig,
        ensIndexerPublicConfig,
        ensRainbowPublicConfig,
      );
    }

    return this.immutableStackInfo;
  }
}
