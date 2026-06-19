import type { EnsDbEnvironment, RpcEnvironment } from "@ensnode/ensnode-sdk/internal";

/**
 * Represents the raw, unvalidated environment variables for the ENSIndexer application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `ENSIndexerConfig`.
 */
export type ENSIndexerEnvironment = EnsDbEnvironment &
  RpcEnvironment & {
    NAMESPACE?: string;
    PLUGINS?: string;
    SUBGRAPH_COMPAT?: string;

    // Chain-specific end blocks, keyed by chain id (e.g. END_BLOCK_1, END_BLOCK_8453). Mirrors the
    // RPC_URL_<chainId> convention. See ENSIndexerConfig.chainEndBlocks.
    [x: `END_BLOCK_${number}`]: string | undefined;

    ENSRAINBOW_URL?: string;
    LABEL_SET_ID?: string;
    LABEL_SET_VERSION?: string;
  };
