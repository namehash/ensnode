import { ChainId } from "@ensnode/datasources";
import type { ChainIdString, UrlString } from "@ensnode/ensnode-sdk";
import type { ENSIndexerConfig, RpcConfig } from "./types";

/**
 * Serialized representation of {@link RpcConfig}
 */
export interface SerializedRpcConfig extends Omit<RpcConfig, "url"> {
  /**
   * String representation of {@link RpcConfig.url}.
   */
  url: UrlString;
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
   * String representation of {@link ENSIndexerConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];

  /**
   * String representation of {@link ENSIndexerConfig.rpcConfig}.
   */
  rpcConfigs: Record<ChainIdString, SerializedRpcConfig>;
}
