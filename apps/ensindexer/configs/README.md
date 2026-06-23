# Hosted Instance Configurations

Canonical, importable `.env` files for the named ENSIndexer "indexing identity" configurations used
by the remote-checkpoint pipeline (`alpha`, `mainnet`).

Deployment-specific vars are **not** here — they are supplied per-environment:

- `ENSDB_URL`, `ENSINDEXER_SCHEMA_NAME`
- `ENSRAINBOW_URL`
- an `RPC_URL_<chainId>` (or provider key) for every chain the active plugins index
