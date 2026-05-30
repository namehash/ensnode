import type { EnsDbEnvironment, RpcEnvironment } from "@ensnode/ensnode-sdk/internal";

/**
 * Environment variables for `eth_getLogs` block range overrides.
 *
 * `ETH_GET_LOGS_BLOCK_RANGE` sets a default applied to every chain, and each
 * `ETH_GET_LOGS_BLOCK_RANGE_${chainId}` overrides that default for a specific chain (a value of `0`
 * disables the override for that chain, so Ponder auto-determines its range). These cap Ponder's
 * auto-determined maximum `eth_getLogs` block range.
 * @see https://ponder.sh/docs/config/chains#eth_getlogs-block-range
 */
export interface EthGetLogsBlockRangeEnvironment {
  ETH_GET_LOGS_BLOCK_RANGE?: string;
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
