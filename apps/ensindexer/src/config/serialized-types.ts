import type { ChainId, ChainIdString, UrlString } from "@ensnode/ensnode-sdk";
import type { EnsRainbowClientLabelSet } from "@ensnode/ensrainbow-sdk";
import type { ENSIndexerConfig, RpcConfig } from "./types";

/**
 * Serialized representation of {@link RpcConfig}
 */
export interface SerializedRpcConfig extends Omit<RpcConfig, "httpRPCs" | "websocketRPC"> {
  /**
   * Serialized representation of {@link RpcConfig.httpRPCs}.
   *
   * Array guaranteed to contain at least 1 element.
   */
  httpRPCs: [UrlString, ...UrlString[]];

  /**
   * Serialized representation of {@link RpcConfig.websocketRPC}.
   */
  websocketRPC?: UrlString;
}

/**
 * Serialized representation of {@link ENSIndexerConfig}
 */
export interface SerializedENSIndexerConfig
  extends Omit<
    ENSIndexerConfig,
    "ensIndexerUrl" | "ensRainbowUrl" | "indexedChainIds" | "rpcConfigs" | "plugins"
  > {
  /**
   * Serialized representation of {@link ENSIndexerConfig.ensIndexerUrl}.
   */
  ensIndexerUrl: UrlString;

  /**
   * Serialized representation of {@link ENSIndexerConfig.ensRainbowUrl}.
   */
  ensRainbowUrl: UrlString;

  /**
   * The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
   */
  labelSet: Required<EnsRainbowClientLabelSet>;

  /**
   * Serialized representation of {@link ENSIndexerConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];

  /**
   * Serialized representation of {@link ENSIndexerConfig.rpcConfigs}.
   */
  rpcConfigs: Record<ChainIdString, SerializedRpcConfig>;

  /**
   * Serialized representation of {@link ENSIndexerConfig.plugins}.
   *
   * For future-proofing, this is a list of strings that may or may
   * not be currently valid {@link PluginName} values.
   *
   * Invariants:
   * - A set of strings with at least one value.
   */
  plugins: string[];
}
