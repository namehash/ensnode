import {
  DatabaseEnvironment,
  EnsIndexerUrlEnvironment,
  EnsNamespaceEnvironment,
  RpcEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Represents the raw, unvalidated environment variables for the ENSAPI application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `EnsApiConfig`.
 */
export type EnsApiEnvironment = DatabaseEnvironment &
  EnsIndexerUrlEnvironment &
  RpcEnvironment &
  EnsNamespaceEnvironment;
