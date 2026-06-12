# ENSIndexer

Ponder app indexing ENS across chains. ENS-protocol concepts (names, labels/labelhash, normalization, resolution, the registry/registrar/resolver model) live in the ensskills `ens-protocol` skill and the docs — read those, don't re-derive here.

## Ponder

- Schema changes never require a migration step. Ponder only runs fully-compatible indexes against existing schemas; otherwise the index is dropped and rebuilt from scratch. Do not propose, plan, or write migration code for the ensindexer drizzle schema.
- Schema or handler changes always require a re-index. This is implicit — never qualify plans with "requires reindex" or similar.
- Access entities by primary key only. Ponder's cache layer keys on PK; filters or complex selects force a flush to Postgres and are extremely unperformant in the hot path. If you need a non-PK lookup at index time, design the schema so the lookup key is the primary key.
- TOCTOU is never a concern inside Ponder event handlers. Ponder serializes events per chain and runs each handler in a transaction, so a read-modify-write against the same row from two handlers cannot interleave. Bot reviewers will sometimes flag this — dismiss those comments.
- Ordering is forced to `omnichain` (see `src/ponder/config.ts`); `multichain` is not supported.

## Custom Ponder root

- Ponder's root is `./ponder`, not `./src`. App source lives in `src/` (imported via `@/*`); `ponder/` holds only what Ponder bundles: `ponder.config.ts` (re-exports `src/ponder/config.ts`), `ponder.schema.ts` (re-exports `@ensnode/ensdb-sdk/ensindexer-abstract`), and `ponder/src/register-handlers.ts` + `ponder/src/api/`. This keeps colocated `*.test.ts` out of Ponder's handler bundle.
- The drizzle schema is owned by `@ensnode/ensdb-sdk` (the "abstract" ENSIndexer Schema), not defined locally. Edit schema there.

## Plugin architecture

- A plugin (`src/plugins/*/plugin.ts` via `createPlugin`) declares `requiredDatasourceNames` + `allDatasourceNames` and a lazy `createPonderConfig`. Datasources (chains/contracts/start blocks/ABIs) come from `@ensnode/datasources`, keyed by `NAMESPACE`.
- `NAMESPACE` (mainnet/sepolia/ens-test-env) + `PLUGINS` (comma-list) are the two knobs. A plugin can only activate if its required datasources exist in the namespace (`src/config/validations.ts`). `src/ponder/config.ts` merges active plugins' Ponder configs into one.
- Contract names are namespaced per-plugin via `namespaceContract` → `"<plugin>/<Contract>"`, because plugins reuse contract names (e.g. `subgraph/Registry` vs `basenames/Registry`). This prefix becomes the Ponder handler name (`subgraph/Registry:NewResolver`).
- Two registration sites must stay in sync when adding a plugin: `ALL_PLUGINS` in `src/plugins/index.ts` (config merge) and the conditional `attach_*Handlers()` calls in `ponder/src/register-handlers.ts` (handler registration).

## Same-log handler ordering (footgun)

- `attach_*()` call order does NOT control dispatch order. Ponder orders by checkpoint (chainId, blockNumber, txIndex, logIndex). Two handlers on the **same log** (e.g. Unigraph + ProtocolAcceleration both on `ENSv1Registry:NewResolver`) get identical checkpoints and Ponder's tie-break is non-deterministic — never rely on ordering between same-log handlers. Cross-log ordering IS deterministic (e.g. NodeMigration writes `nodeIsMigrated` on the new Registry's log; Old-registry guards read it on a different log).
- See the long comment in `register-handlers.ts` before touching ProtocolAcceleration/Unigraph/NodeMigration registration.

## ENSRainbow on the hot path

- `labelByLabelHash` (`src/lib/graphnode-helpers.ts`) calls ENSRainbow for label healing on _every_ event needing it. Must be a colocated/local `ENSRAINBOW_URL`; the public server makes indexing extremely slow. Transient failures (network, 500) retry with backoff; any unrecovered throw propagates and crashes the process (intentional — forces re-index from checkpoint). `ENSRainbow` readiness/health is awaited before any onchain handler runs (`src/lib/indexing-engines/init-indexing-onchain-events.ts`).
- `LABEL_SET_ID`/`LABEL_SET_VERSION` are pinned and part of indexing behavior — changing them changes results.
- `DISABLE_ENSRAINBOW_HEAL=true` (undocumented env) makes `labelByLabelHash` early-return `null` — every label is treated as unhealable. For benchmarking only (see the `ensindexer-perf-testing` skill); it changes indexing output, never set it in production.

## Indexing-behavior build ID

- `src/ponder/indexing-behavior-injection-contract.ts` injects a fake contract whose `indexingBehaviorDependencies` (namespace, sorted plugins, blockrange, `isSubgraphCompatible`, `clientLabelSet`, ENSDb schema checksum) feed Ponder's Build ID. Any config that changes indexing output MUST be added here, or Ponder will wrongly resume an incompatible schema. Plugins are sorted so order-only differences don't fork the Build ID.

## SUBGRAPH_COMPAT

- Toggles how Literal Labels/Names are interpreted (Subgraph-Interpreted vs Interpreted) and changes default `PLUGINS`/label-set. When true the config must be Subgraph-Compatible or an invariant throws. Affects indexing output; see `.env.local.example` for the full semantics.

## Cross-service contract

- ENSIndexer is the _exclusive writer_ to its ENSDb schema, named by `ENSINDEXER_SCHEMA_NAME`. ENSApi reads the **same** schema name (`ensapi`'s `ENSINDEXER_SCHEMA_NAME` must match) — this is the integration point between the two services. Multiple indexers can share an ENSDb only with distinct schema names.
- Beyond the Ponder-managed entity tables, ENSIndexer runs `EnsDbWriterWorker` (`src/lib/ensdb-writer-worker/`) which periodically upserts the IndexingMetadataContext record (indexing status / stack info) that ENSApi reads for its status/probe endpoints.

## Env / dev

- Copy `.env.local.example` → `.env.local`. Required: `ENSDB_URL`, `ENSINDEXER_SCHEMA_NAME`, `ENSRAINBOW_URL`, `NAMESPACE`, `PLUGINS`, `LABEL_SET_ID`/`LABEL_SET_VERSION`, and an `RPC_URL_<chainId>` (or provider key) for every chain the active plugins index.
- `pnpm dev` forces `ENSINDEXER_SCHEMA_NAME=ensindexer_temp_dev` + `--disable-ui` and recreates the schema on every behavior change. `pnpm start` uses your real `$ENSINDEXER_SCHEMA_NAME` and refuses to reuse a schema built with different indexing behavior.

## Deep procedures (skills, don't duplicate)

- Perf testing this app: `ensindexer-perf-testing` skill.
- Inspecting/editing Ponder's RPC sync cache (`ponder_sync` schema): `edit-ponder-sync` skill.
