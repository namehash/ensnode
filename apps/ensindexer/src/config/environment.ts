import type { EnsDbEnvironment, RpcEnvironment } from "@ensnode/ensnode-sdk/internal";

/**
 * Environment variables for per-chain `eth_getLogs` block range overrides.
 *
 * Each `ETH_GET_LOGS_BLOCK_RANGE_${chainId}`, if specified, overrides Ponder's auto-determined
 * maximum `eth_getLogs` block range for that chain.
 * @see https://ponder.sh/docs/config/chains#eth_getlogs-block-range
 */
export interface EthGetLogsBlockRangeEnvironment {
  [x: `ETH_GET_LOGS_BLOCK_RANGE_${number}`]: string | undefined;
}

/**
 * Represents the raw, unvalidated environment variables for the ENSIndexer application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `ENSIndexerConfig`.
 */
export type ENSIndexerEnvironment = EnsDbEnvironment &
  RpcEnvironment &
  EthGetLogsBlockRangeEnvironment & {
    NAMESPACE?: string;
    PLUGINS?: string;
    SUBGRAPH_COMPAT?: string;

    START_BLOCK?: string;
    END_BLOCK?: string;

    ENSRAINBOW_URL?: string;
    LABEL_SET_ID?: string;
    LABEL_SET_VERSION?: string;
  };
