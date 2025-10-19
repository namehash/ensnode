export interface EnsApiEnvironment {
  // abstract DatabaseEnvironment into an internal interface and re-use between indexer and api
  // etc etc for other configuration options
  DATABASE_URL?: string;
  DATABASE_SCHEMA?: string;
  ENSINDEXER_URL?: string;

  // abstract RpcEnvironment into an internal type and re-use between indexer and api
  // move all implementation of rpc-from-environment into sdk/internal
}
