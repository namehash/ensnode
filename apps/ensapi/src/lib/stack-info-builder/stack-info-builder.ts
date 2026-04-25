import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import {
  buildEnsNodeStackInfo,
  type EnsNodeStackInfo,
  IndexingMetadataContextStatusCodes,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig, type EnsApiConfig } from "@/config/config.schema";

export class StackInfoBuilder {
  /**
   * Cached {@link EnsNodeStackInfo} object.
   *
   * It is immutable for the lifecycle of an ENSApi instance.
   */
  private immutableStackInfo: EnsNodeStackInfo | undefined = undefined;

  public constructor(
    private readonly ensApiConfig: EnsApiConfig,
    private readonly ensDbClient: EnsDbReader,
  ) {}

  /**
   * Builds the {@link EnsNodeStackInfo} object and caches it for future calls.
   *
   * The ENSNode Stack Info is considered immutable for the lifecycle of
   * an ENSApi instance, so once it is successfully built, it will be
   * cached and returned for all future calls.
   */
  public async buildStackInfo(): Promise<EnsNodeStackInfo> {
    const indexingMetadataContext = await this.ensDbClient.getIndexingMetadataContext();

    if (indexingMetadataContext.statusCode !== IndexingMetadataContextStatusCodes.Initialized) {
      throw new Error("Indexing metadata context is uninitialized in ENSDb.");
    }

    const {
      ensIndexer: ensIndexerPublicConfig,
      ensDb: ensDbPublicConfig,
      ensRainbow: ensRainbowPublicConfig,
    } = indexingMetadataContext.stackInfo;

    const ensApiPublicConfig = buildEnsApiPublicConfig(this.ensApiConfig, ensIndexerPublicConfig);

    this.immutableStackInfo = buildEnsNodeStackInfo(
      ensApiPublicConfig,
      ensDbPublicConfig,
      ensIndexerPublicConfig,
      ensRainbowPublicConfig,
    );

    return this.immutableStackInfo;
  }

  /**
   * Gets the cached {@link EnsNodeStackInfo} object.
   * @throws Error if {@link immutableStackInfo} is not set,
   * which means {@link buildStackInfo} has not been successfully called yet.
   */
  public getCachedStackInfo(): EnsNodeStackInfo {
    if (!this.immutableStackInfo) {
      throw new Error(
        "EnsNodeStackInfo has not been built yet. Make sure to call buildStackInfo() first.",
      );
    }

    return this.immutableStackInfo;
  }
}
