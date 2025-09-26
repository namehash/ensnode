import type { ChainId, ChainIdString, UrlString } from "@ensnode/ensnode-sdk";
import type { EnsRainbowClientLabelSet } from "@ensnode/ensrainbow-sdk";
import type { ENSIndexerConfig, RpcConfig } from "./types";

/**
 * Serialized representation of {@link RpcConfig}
 */
export interface SerializedRpcConfig extends Omit<RpcConfig, "httpRPCs" | "websocketRPC"> {
  /**
   * String representation of {@link RpcConfig.httpUrls}.
   */
  httpRPCs: [UrlString, ...UrlString[]];

  /**
   * String representation of {@link RpcConfig.webSocketUrl}.
   */
  websocketRPC?: UrlString;
}

/**
 * Serialized representation of {@link ENSIndexerConfig}
 */
export interface SerializedENSIndexerConfig
  extends Omit<
    ENSIndexerConfig,
    | "ensAdminUrl"
    | "ensNodePublicUrl"
    | "ensIndexerUrl"
    | "ensRainbowUrl"
    | "indexedChainIds"
    | "rpcConfigs"
  > {
  /**
   * String representation of {@link ENSIndexerConfig.ensAdminUrl}.
   */
  ensAdminUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerConfig.ensIndexerUrl}.
   */
  ensIndexerUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerConfig.ensNodePublicUrl}.
   */
  ensNodePublicUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerConfig.ensRainbowUrl}.
   */
  ensRainbowUrl: UrlString;

  /**
   * The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
   */
  labelSet: Required<EnsRainbowClientLabelSet>;

  /**
   * String representation of {@link ENSIndexerConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];

  /**
   * String representation of {@link ENSIndexerConfig.rpcConfigs}.
   */
  rpcConfigs: Record<ChainIdString, SerializedRpcConfig>;
}
