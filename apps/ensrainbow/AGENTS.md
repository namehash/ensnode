# ENSRainbow

Label-healing service: maps a 32-byte labelHash → its original label over a LevelDB (classic-level) database. See `packages/ensskills/skills/` for the ENS-protocol concepts (labelhash, label healing, encoded labelhash).

## Entry point: CLI only

- No `dev` script. Everything routes through `src/cli.ts` (yargs). Subcommands: `serve`, `entrypoint`, `ingest-ensrainbow`, `validate[ --lite]`, `purge`, `convert` (CSV→.ensrainbow), `convert-sql` (legacy SQL dump→.ensrainbow). Run via `pnpm <script>` (see package.json scripts).
- The commented-out `ingest` command (SQL dump → LevelDB) in `cli.ts` is dead — leave it.
- `serve` opens an already-populated `data-dir` and serves. `entrypoint` (the Docker `ENTRYPOINT`) binds HTTP _immediately_ then downloads+extracts+validates the DB in a background task — `/health` and `/ready` answer during bootstrap; DB-backed routes (`/v1/heal`, `/v1/labels/count`, `/v1/config`) return 503 until attached.

## DB layout & data dirs (gitignored)

- `data-dir` is a _parent_ dir; the actual LevelDB lives in `data-dir/data-<labelSetId>_<labelSetVersion>/` (e.g. `data-subgraph_0/`). `entrypoint` writes a `ensrainbow_db_ready` marker file alongside it; on restart, marker + subdir present ⇒ reuse without re-download.
- `data/`, `data-*`, `test-data/` are gitignored — any such dirs present locally are artifacts, never source.
- Prebuilt DBs come from a Labelset Server (`ENSRAINBOW_LABELSET_SERVER_URL`, default `https://bucket.ensrainbow.io`) as `databases/<schema>/<id>_<version>.tgz`, fetched by `scripts/download-prebuilt-database.sh`. `download-rainbow-tables.sh` (root) is the _legacy_ raw-table fetcher — different path/format.
- `.ensrainbow` is a versioned protobuf format (`src/utils/protobuf-schema.ts`) carrying rainbow records + `label_set_id`/`label_set_version` metadata; files are named `<labelSetId>_<labelSetVersion>.ensrainbow` and served by the Labelset Server under `labelsets/<basename>` (with `.sha256sum` + `.LICENSE.txt` siblings; see `scripts/download-ensrainbow-files.sh`). `ingest-ensrainbow` ingests them into LevelDB; `convert`/`convert-sql` produce them.

## Invariants & gotchas

- `DB_SCHEMA_VERSION` is hardcoded in `src/lib/database.ts` (currently 3). It is duplicated as the env/config default; `invariant_dbSchemaVersionMatch` rejects any env value ≠ the code constant. Bumping the schema means bumping this constant — `validate`/`open` refuse a DB whose stored schema version differs (forces purge + re-ingest).
- DB keys: 32 bytes ⇒ rainbow record (the labelHash); any other length ⇒ system/metadata key (count, ingestion status, schema version, highest label-set version, label-set id). Never use a 32-byte system key. Values are UTF-8 labels stored verbatim (may be non-normalized, contain dots/null bytes, or be empty).
- Records are _versioned_: each stores a `labelSetVersion`. A heal is simulated as not-found when the record's version exceeds the client's requested `label_set_version` (`needToSimulateAsUnhealable`) — so a single DB can serve clients pinned to older label-set versions. `convert` against an `--existing-db-path` auto-increments to the next version and skips already-present labels.
- `entrypoint` re-validates the env/CLI `LABEL_SET_ID`/`LABEL_SET_VERSION` against the _attached DB's_ label set after bootstrap; mismatch ⇒ refuse to serve and `process.exit(1)` (won't serve a misconfigured DB).
- Heal double-checks every result by recomputing the labelHash from the stored label and returns not-found on mismatch (guards against corrupt records, issue #2188).
- `validate --lite` (also run on every `open`/`attachDb`) only checks metadata; full `validate` iterates every record verifying hash↔label and the precalculated count. The count is precalculated/stored, never computed at serve time.

## Port

- Default `3223`. Precedence: `--port` flag > `PORT` env > default. Validated by `PortNumberSchema`.

## Heal API contract

- `GET /v1/heal/:labelHash` accepts optional `label_set_id` + `label_set_version` query params (`src/lib/api.ts`). A mismatched `label_set_id` is an error; a pinned `label_set_version` makes healing deterministic — records with a newer version are simulated as not-found (see versioned records above). Clients (the ensrainbow-sdk, ENSIndexer) pin both for reproducible indexing.

## Cross-service contract (ENSIndexer)

- ENSIndexer calls `heal` on the hot path for every label-bearing event via `@ensnode/ensrainbow-sdk` (`apps/ensindexer/src/lib/graphnode-helpers.ts`); a non-retryable heal error or exhausted retries _crashes the indexer and forces a re-index_. ENSIndexer blocks startup on `/health` then `/ready` (`waitForEnsRainbowToBeReady` retries 503 for ~1h to cover cold-start bootstrap; non-503 aborts fast). Run ENSRainbow on the same network as ENSIndexer in production.

## Testing

- Tests open real classic-level DBs in tmp dirs (`mkdtemp`) — no shared fixture DB required; `test/fixtures/` holds small input files. `*.integration.test.ts` is excluded by `vitest.config.ts` (needs network/real labelset server).
- `cli.ts` `.fail()` rethrows under `VITEST` so `cli.parse` throws (instead of printing help) for assertions.
