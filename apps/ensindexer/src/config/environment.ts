import {
  DatabaseEnvironment,
  EnsIndexerUrlEnvironment,
  RpcEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Represents the raw, unvalidated environment variables for the ENSIndexer application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `ENSIndexerConfig`.
 */
export interface ENSIndexerEnvironment
  extends DatabaseEnvironment,
    EnsIndexerUrlEnvironment,
    RpcEnvironment {
  NAMESPACE?: string;
  PLUGINS?: string;
  SUBGRAPH_COMPAT?: string;

  START_BLOCK?: string;
  END_BLOCK?: string;

  ENSRAINBOW_URL?: string;
  LABEL_SET_ID?: string;
  LABEL_SET_VERSION?: string;
}
