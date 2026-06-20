# ENSIndexer named configs

Canonical, importable `.env` files for the named ENSIndexer "indexing identity" configurations used
by the remote-checkpoint pipeline (`alpha`, `mainnet`).

Each file holds only the env vars that determine **indexing behavior** and therefore feed Ponder's
Build ID (`NAMESPACE`, `SUBGRAPH_COMPAT`, `PLUGINS`, `LABEL_SET_ID`, `LABEL_SET_VERSION`). They are
the single source of truth for the **build_id parity contract**: the box that produces a checkpoint
must run the exact same identity as the deployed Railway service, or the warm-loaded schema will fail
to resume (Ponder throws on a Build ID mismatch).

Deployment-specific vars are **not** here — they are supplied per-environment:

- `ENSDB_URL`, `ENSINDEXER_SCHEMA_NAME`
- `ENSRAINBOW_URL`
- an `RPC_URL_<chainId>` (or provider key) for every chain the active plugins index

Consumed by sourcing in bash (`set -a; . configs/<config>.env; set +a`) or any dotenv reader.

Note: `EFP` is enabled only in `alpha.env`, not in the shared `EnvironmentDefaults.alpha` default,
because its datasources are mainnet-only — see `src/config/environment-defaults.ts`.
