---
name: ENSDb CLI Tool
overview: Create a new `apps/ensdb-cli` application that provides database inspection, schema management, and snapshot import/export/push/pull operations for ENSDb, targeting 50-100GB PostgreSQL databases with S3-compatible storage and safe restore flows for fresh or isolated databases.
todos:
  - id: scaffold
    content: "Scaffold apps/ensdb-cli: package.json, tsconfig, vitest config, yargs entry point, workspace integration"
    status: pending
  - id: inspect
    content: "Implement inspect command: list schemas with classification, per-schema details (tables, sizes, row counts)"
    status: pending
  - id: schema-drop
    content: Implement schema drop command with safety confirmation
    status: pending
  - id: pgdump-wrapper
    content: Implement pg_dump/pg_restore wrapper with parallel jobs and progress reporting
    status: pending
  - id: snapshot-create
    content: "Implement snapshot create: dump indexer schemas + ponder_sync + ensnode + ensnode_metadata.json; manifest includes postgresVersion, ensnode.drizzleMigrations fingerprint, checksums"
    status: pending
  - id: snapshot-restore
    content: "Implement snapshot restore: preflight (fresh DB, conflicts, ENSNODE_BOOTSTRAP_REQUIRED, version/Drizzle/build compatibility vs manifest), --skip-preflight escape hatch; full + selective + --bootstrap-ensnode paths"
    status: pending
  - id: s3-client
    content: Implement S3-compatible client layer with multipart upload/download support
    status: pending
  - id: snapshot-push
    content: "Implement snapshot push: upload snapshot artifacts and manifest to S3-compatible storage"
    status: pending
  - id: snapshot-pull
    content: "Implement snapshot pull: download from S3-compatible storage, verify checksums"
    status: pending
  - id: snapshot-verify
    content: "Implement snapshot verify: validate a local snapshot manifest and checksums without restoring"
    status: pending
  - id: snapshot-list-info
    content: Implement snapshot list and snapshot info commands for browsing remote snapshots
    status: pending
  - id: snapshot-delete
    content: "Implement snapshot delete: list objects under snapshot prefix, delete with --force or confirmation"
    status: pending
  - id: dockerfile
    content: Create Dockerfile with postgresql-client for pg_dump/pg_restore
    status: pending
  - id: docs
    content: Add documentation and README
    status: pending
isProject: false
---

# ENSDb CLI Tool

## Context

ENSNode production databases are 50-100GB PostgreSQL instances. Each chain deployment gets its own indexer schema following the naming convention `{deployment}Schema{version}`. Three schema types coexist in one database:

**Production database (7 schemas):**

- **Indexer schemas (5):**
  - `alphaSchema1.9.0` -- alpha deployment (all chains)
  - `alphaSepoliaSchema1.9.0` -- alpha sepolia
  - `mainnetSchema1.9.0` -- mainnet
  - `sepoliaSchema1.9.0` -- sepolia
  - `v2SepoliaSchema1.9.0` -- v2 sepolia
- **Shared schemas (2):**
  - `ensnode` -- application schema: `metadata` table (rows scoped by `ens_indexer_schema_name`) + `__drizzle_migrations` (Drizzle migration journal). Full schema must be preserved on full restore.
  - `ponder_sync` -- shared RPC cache and sync state (needed by every indexer)

Schema names are set via `ENSINDEXER_SCHEMA_NAME` env var in the blue-green deploy workflow (`[.github/workflows/deploy_ensnode_blue_green.yml](.github/workflows/deploy_ensnode_blue_green.yml)`). Old schemas are orphaned on redeploy and must be dropped manually to reclaim space. Also, all orphaned records in ENSNode Metadata tables must be deleted manually.

The goal is to enable fast ENSNode bootstrap (hours instead of 2-3 days) by snapshotting and restoring database state.

### Related Issues

- [#833](https://github.com/namehash/ensnode/issues/833) -- Simplify downloading of `ponder_sync` for internal developers. The CLI's `snapshot pull` and `snapshot restore` commands directly address this by supporting selective download of just `ponder_sync` from a remote snapshot.
- [#1127](https://github.com/namehash/ensnode/issues/1127) -- Matrix ENSApi smoke tests across subgraph-compat, alpha-style, and v2 configs. The CLI's snapshot infrastructure enables setting up isolated test databases with specific indexer configurations for CI smoke testing. See "CI Test Matrix Support" section below.
- [#279](https://github.com/namehash/ensnode/issues/279) -- Count Unknown Names & Unknown Labels. A future roadmap extension: the CLI's database access and inspect infrastructure can be extended with an `analyze` command to compute analytical metrics over indexed data. See "Future Roadmap" section below.

## Architecture Decisions

### Snapshot UX principles

The snapshot system should optimize for a fast, low-friction developer experience while staying operationally safe for 50–100GB databases.

- **Restore modes**: keep the user-facing model simple.
  - **Full** (omit `--schemas`): restore every indexer dump in the snapshot + `ponder_sync` + **`ensnode` via `pg_restore` from `ensnode.dump.tar.zst`** (includes `metadata` and `__drizzle_migrations`). Do **not** rebuild `ensnode` from JSON alone in this mode; `ensnode_metadata.json` is redundant for data integrity but still useful for listing and verification.
  - `ponder_sync` only (`--ponder-sync-only`)
  - **Selective**: chosen indexer schema(s) (`--schemas ...`) plus the matching rows from `ensnode.metadata` (replayed from `ensnode_metadata.json`); optional `ponder_sync`. Does **not** `pg_restore` the full `ensnode` dump (would clobber other indexers’ metadata).

  `ponder_sync` is **included by default** for selective restore. Pass **`--without-ponder-sync`** to opt out.

  - **Read-only consumers** (ENSApi serving, analytics, any app that will not run ENSIndexer): pass `--without-ponder-sync` — it is not needed.
  - **Indexer operators** (restore then run ENSIndexer to keep the DB updated): keep `ponder_sync` (the default) — it preserves sync/RPC cache state and speeds up reaching a healthy following state.
- **Manifest-driven tooling**: `manifest.json` is the source of truth for:
  - which artifacts exist under `{prefix}/{snapshot-id}/`
  - per-artifact sizes and checksums
  - metadata required to derive UI “capabilities” (via `deriveCapabilities(...)`, not stored in the manifest)
- **Resumable + retry downloads (roadmap)**: Large snapshot downloads should tolerate flaky networks.
  - download to a `.part` file
  - resume via HTTP range requests
  - retry with backoff on failure

S3-compatible storage supports range reads, so `snapshot pull` can add an optional resumable mode in a later iteration (v1 can stay simple).

### Snapshot Composition

A full snapshot contains **separate pg_dump archives** for:

1. **Every indexer deployment schema** currently present in the database (e.g. `mainnetSchema1.9.0`, `alphaSchema1.9.0`). The CLI discovers these by enumerating non-system schemas and **excluding** `ponder_sync`, `ensnode`, and PostgreSQL system schemas. If unrelated application schemas exist in the same database, add `--ignore-schemas` so they are not dumped by mistake. When `--ignore-schemas` is used, the manifest should record which schemas were **ignored** (so consumers can tell whether the source DB had additional schemas that were intentionally excluded).
2. The `ponder_sync` schema (full)
3. The **`ensnode` schema (full `pg_dump`)** → `ensnode.dump.tar.zst`, same directory-format + tar+zstd pipeline as other schemas. This captures **`metadata`, `__drizzle_migrations`,** and any other objects under `ensnode` so a **full** restore is faithful to the source DB.
4. **`ensnode_metadata.json`** -- export of all `ensnode.metadata` rows (JSON). Used for manifest enrichment, `snapshot list` summaries, and **selective** restore (replay only the rows for chosen indexer schema names). It is **not** a substitute for `ensnode.dump.tar.zst` on full restore.

**Optional manifest enrichment (best-effort):**

- `ponderSync.chainIdsPresent` -- list of chain IDs observed in the `ponder_sync` RPC cache at snapshot time (if derivable cheaply and deterministically from the current `ponder_sync` schema). This should be **best-effort**: if the CLI can’t derive it reliably (schema differs, missing columns, etc.), omit the field rather than failing snapshot creation.

**Full snapshot workflows:**

1. `snapshot pull` with no `--schemas` downloads all artifacts, including `ensnode.dump.tar.zst` and `ensnode_metadata.json`.
2. `snapshot restore` with no `--schemas` runs preflight for a full clone, then `pg_restore`s all indexer dumps, `ponder_sync`, and **`ensnode`** from `ensnode.dump.tar.zst`. JSON is not the source of truth for `ensnode` in this path.

**Selective workflows:**

1. `snapshot pull --schemas ...` downloads the selected indexer archives + `ensnode_metadata.json` + `ensnode.dump.tar.zst` and (by default) `ponder_sync`. The `ensnode` dump is always included because it is very small (tens of KB). For a **clean** target database, selective restore can bootstrap Drizzle state from the snapshot (see below).
2. `snapshot restore --schemas ...` restores the selected indexer schema dumps and reconciles `ensnode.metadata`. On a **clean** DB this **must** also establish **`ensnode.__drizzle_migrations`** (JSON alone cannot do that). Two supported approaches (document which is default for CI):
   - **Migrate-first:** Run ENSDb/ENSIndexer migrations against the empty database **before** `snapshot restore --schemas`, creating `ensnode` + `__drizzle_migrations`; then the CLI restores indexer dumps and **upserts** filtered rows from `ensnode_metadata.json`.
   - **Bootstrap-from-snapshot:** Pass **`--bootstrap-ensnode`** (requires `ensnode.dump.tar.zst` under `--input`). The CLI `pg_restore`s the full `ensnode` schema (migrations + `metadata` as captured), **deletes** `ensnode.metadata` rows whose `ens_indexer_schema_name` is **not** in `--schemas`, then restores the selected indexer dumps. Optionally still apply JSON upsert for the target schemas to match checksums exactly.

Because `ponder_sync` is shared state, `snapshot restore` is intended for **fresh or isolated target databases only**. The CLI enforces that with **preflight checks** (below) instead of relying on operator discipline alone.

**Implementation notes:**

- **Full restore:** `pg_restore` the `ensnode` dump so `__drizzle_migrations` matches the snapshot source. If JSON and dump ever disagree, **the dump wins** (JSON is auxiliary).
- **Selective restore (shared `ensnode` already present):** Do not `pg_restore` `ensnode.dump.tar.zst` (would clobber `__drizzle_migrations` / other indexers' metadata). Replay only the relevant `ensnode.metadata` rows from `ensnode_metadata.json` after preflight passes. **Upsert semantics:** `INSERT ... ON CONFLICT (ens_indexer_schema_name, key) DO UPDATE SET value = EXCLUDED.value` (primary key from `ensdb-sdk`).
- **Selective restore (clean database):** You **must** get `__drizzle_migrations` from somewhere: either **migrate-first** (app creates `ensnode`) or **`--bootstrap-ensnode`** from `ensnode.dump.tar.zst` + metadata prune. Failing that, preflight should fail with a dedicated error (e.g. `ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_BOOTSTRAP_REQUIRED`) if `ensnode` / `__drizzle_migrations` is missing when `--bootstrap-ensnode` was not used and migrations were not run. Exact rules should be validated against how ENSIndexer/ENSApi expect `ensnode` after a partial restore.

### Preflight checks (`snapshot restore`)

Runs in the **restore command handler** immediately after validating CLI args, loading the manifest, and computing the **effective restore plan** (target schemas, whether `ponder_sync` will be restored, whether `ensnode` will be replaced, and whether `--drop-existing` applies). Preflight still runs **before** any destructive action and **before** any `pg_restore`.

**Checks (fail closed by default):**

1. **ponder_sync non-empty:** If schema `ponder_sync` exists, check it **deterministically**: enumerate all base tables in `ponder_sync`; if any table contains at least one row, fail with identifier `ENSDB_CLI_ERR_PREFLIGHT_PONDER_SYNC_NONEMPTY`. If the schema exists but has no base tables, treat it as empty. Do **not** rely on `pg_stat_user_tables` estimates for this guardrail.
2. **ensnode / metadata conflicts:**
   - **Full** restore (no `--schemas`): treat **`ensnode` as a unit**. If schema `ensnode` exists and has any user objects, fail with `ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_METADATA_NONEMPTY` — **unless** `--drop-existing` is also set (preflight recognizes it will be dropped in the next step) **or** `--skip-preflight`.
   - **Selective** restore (`--schemas`): if `ensnode.metadata` exists, fail if any row’s `ens_indexer_schema_name` is **not** in the target schema set (`ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_METADATA_CONFLICT`). If **`ensnode` is absent** (or `__drizzle_migrations` missing / empty when required) and **`--bootstrap-ensnode` is not set**, fail with `ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_BOOTSTRAP_REQUIRED` (message: run migrations first or pass `--bootstrap-ensnode`). If **`--bootstrap-ensnode` is set** but **`ensnode` already exists** with objects, fail unless **`--drop-existing`** is set (will drop `ensnode` before bootstrap restore).
3. **Unexpected non-system schemas / objects:** Enumerate schemas outside PostgreSQL system namespaces (`pg_*`, `information_schema`, etc.). For the intended restore set, fail if a **non-target indexer schema** already exists (tables present or schema present) (`ENSDB_CLI_ERR_PREFLIGHT_UNEXPECTED_SCHEMA`). Optionally extend with a stricter mode: fail if `public` (or other default) contains unexpected user tables — keep the rule deterministic in code and documented.
4. **Version / compatibility (target already has `ensnode` or you use migrate-first):** When restoring **into** a database that will keep an existing `ensnode` schema (selective restore **without** `--bootstrap-ensnode`, or any path where Drizzle state is not fully replaced by the snapshot’s `ensnode` dump), compare **snapshot manifest** (and optionally `ensnode_metadata.json`) to **live target** state. **Fail closed** if incompatible unless **`--skip-preflight`** is passed.

### Version and build compatibility (`snapshot restore`)

Restoring beside **existing** migration or metadata state is unsafe if versions diverge: the indexer schema dump may assume tables/columns from migration set **A** while the target’s `__drizzle_migrations` reflects set **B**, or `ensnode.metadata` may carry **versionInfo** / build identifiers that no longer match the app you intend to run.

**At `snapshot create`**, record enough in `manifest.json` to compare on restore (exact shape validated during implementation):

- **`postgresVersion`** (already planned) — target server should be **same major** (and ideally same minor) as the source; mismatch → `ENSDB_CLI_ERR_PREFLIGHT_PG_VERSION_MISMATCH`.
- **`ensnode.drizzleMigrations`** — fingerprint of source `ensnode.__drizzle_migrations` at snapshot time, e.g. ordered list of migration **tags** (or hashes) from Drizzle’s journal. Enables comparing to the **target** `__drizzle_migrations` **before** `pg_restore` when `ensnode` already exists.
- **`indexerConfig.versionInfo`** / **`ensdb_version` metadata** — ENSDb, Ponder, ENSIndexer semver (already in manifest enrichment). If the target `ensnode.metadata` (for the same `ens_indexer_schema_name`) or a CLI flag **`--expected-ensdb-version`** disagrees with the snapshot for the schemas being restored → `ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_METADATA_VERSION_MISMATCH` (or split per product if needed).
- **Build / git / image id** — If `ensindexer_public_config` or other metadata embeds a **build id** or git SHA used operationally, treat it like semver: snapshot vs target mismatch is an **error** by default in v1 (operators can use `--skip-preflight` to bypass all checks). This keeps v1 simple and strict; a future `--allow-build-mismatch` flag can relax it if needed.

**Rules of thumb:**

- **Full restore into an empty database:** After wipe + restore, `ensnode` comes entirely from the snapshot dump, so **Drizzle row mismatch on target** does not apply pre-restore. Still check **PostgreSQL major** compatibility with the dump (`pg_restore` / server).
- **Selective + `--bootstrap-ensnode`:** Replaces `ensnode` from the snapshot (after optional drop); fingerprint in manifest should **match** the restored dump (self-consistent).
- **Selective + migrate-first or shared `ensnode`:** Target **`__drizzle_migrations` must match** the snapshot’s `ensnode.drizzleMigrations` fingerprint (or target must be a strict superset with identical applied tags for shared migrations — pick one deterministic rule in code; **default strict equality** is simplest). Otherwise the restored indexer tables and live migration history can disagree.

**`--drop-existing` scope:**

- **Full** restore: drops **all schemas that will be restored** — every indexer schema in the manifest + `ponder_sync` + `ensnode`. Preflight recognizes this flag and suppresses "non-empty" checks for schemas that will be dropped.
- **Selective** restore: drops only the **named `--schemas`** targets. If `--bootstrap-ensnode` is also set, additionally drops `ensnode`. Drops `ponder_sync` only when `ponder_sync` is being restored (i.e. default behavior, not `--without-ponder-sync`).

**`--skip-preflight`:** skips **all** preflight checks (freshness, conflicts, version / Drizzle / build compatibility). Use only when the operator explicitly accepts overwriting shared state, clobbering metadata, and version skew. Log a clear **stderr warning** when this flag is used (no interactive confirmation — the flag name is the confirmation). `--drop-existing` does **not** bypass preflight; it only suppresses non-empty checks for schemas it will drop. `--skip-preflight` bypasses everything.

**Order of operations:**

1. Preflight (unless skipped via **`--skip-preflight`**)
2. If `--drop-existing` is set and targets exist: **full** drops all indexer schemas + `ponder_sync` + `ensnode`; **selective** drops named `--schemas` + `ponder_sync` (when being restored) + `ensnode` (when `--bootstrap-ensnode` is set)
3. `pg_restore` for dumps (full restore includes `ensnode` from `ensnode.dump.tar.zst`). **Selective:** restore indexer dumps (+ optional `ponder_sync`); then either **`--bootstrap-ensnode`** (`pg_restore` `ensnode` + prune metadata) **or** JSON upsert only onto an `ensnode` that already has migrations (migrate-first path).

**Surfacing errors:** Print distinct messages per failure class; include the `ENSDB_CLI_ERR_PREFLIGHT_*` identifier in the message (and optionally `process.exit` with dedicated codes, e.g. `2` / `3` / `4`, if the team wants scriptable CI — document in README).

**Selective restore:** Preflight must ensure metadata upsert will not clobber other indexers on shared DBs: the `ensnode.metadata` row check above is mandatory before replaying filtered `ensnode_metadata.json`. On **clean** DBs, preflight must ensure **`__drizzle_migrations` will exist** after the command (migrate-first completed, or `--bootstrap-ensnode` with dump on disk).

### Snapshot Format

Use `pg_dump` with `--format=directory` and `--jobs=N` for parallel dump/restore. This is the only format that supports parallelism, which is critical for 50-100GB databases. Each directory-format dump is then archived as a `<schema>.dump.tar.zst` file for storage and transfer, and unpacked to a temporary directory before restore.

- Dump: `pg_dump --format=directory --jobs=4 --schema=<name> --file <tmp>/<schema>.dumpdir`
- Archive: `tar --zstd -cf <snapshot>/<schema>.dump.tar.zst -C <tmp> <schema>.dumpdir`
- Restore: unpack `<schema>.dump.tar.zst` to a temp directory, then run `pg_restore --format=directory --jobs=4 --schema=<name> <tmp>/<schema>.dumpdir`

The implementation should explicitly budget temporary disk usage for both the compressed archive and the unpacked directory during restore. To reduce peak disk usage, process schemas **sequentially** during `snapshot create`: dump one schema to a directory, archive it, delete the directory, then proceed to the next. During `snapshot restore`, similarly unpack and restore one archive at a time, deleting the unpacked directory after each `pg_restore` completes. On failure or interrupt, clean up temp directories (register a process exit handler / signal trap).

**Checksum verification:** Verify `checksums.sha256` at two points: (1) after `snapshot pull` completes (before returning success), and (2) at the start of `snapshot restore --input` before any `pg_restore`. If the snapshot was created locally via `snapshot create`, the restore verification catches corruption from disk issues.

**Tooling prerequisites:** Archiving uses `tar` with zstd compression (`tar --zstd` or pipe to `zstd`). The Docker image and operator docs must include `tar`, `zstd`, and PostgreSQL client tools (`pg_dump`, `pg_restore`) compatible with the server major version.

### S3-compatible Storage Layout

Discovery via `ListObjects` on `{prefix}/` -- each snapshot is a prefix containing a `manifest.json` and per-schema dump files:

```
{prefix}/
  {snapshot-id}/
    manifest.json                     # snapshot metadata (all schemas, sizes, versions)
    {schema-name}.dump.tar.zst        # archived pg_dump directory output (one per indexer schema)
    ponder_sync.dump.tar.zst          # archived dump of ponder_sync
    ensnode.dump.tar.zst              # full pg_dump of schema ensnode (metadata + __drizzle_migrations + ...)
    ensnode_metadata.json             # all ensnode.metadata rows (JSON; listing + selective replay; auxiliary on full restore)
    checksums.sha256                  # integrity verification
```

- `snapshot list` uses `ListObjectsV2` with delimiter `/` to enumerate snapshot prefixes, then fetches each `manifest.json` **in parallel** (with a concurrency limit, e.g. 10) for metadata display. Supports `--limit <n>` (default: 20) to cap the number of snapshots shown and avoid slow listing when many snapshots exist. Results are sorted by `createdAt` descending (newest first).
- `snapshot pull --schemas ...` downloads the selected indexer dump(s) + `ensnode_metadata.json` + `ensnode.dump.tar.zst` (always included; negligible size) and (by default) `ponder_sync.dump.tar.zst`. Add `--without-ponder-sync` for read-only consumers that do not plan to run ENSIndexer after restore.
- `snapshot pull` with no `--schemas` downloads **all** artifacts including `ensnode.dump.tar.zst`.

### Technology

- **CLI framework**: yargs (consistent with ENSRainbow's `apps/ensrainbow/src/cli.ts`)
- **S3-compatible storage**: `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` (multipart uploads for large files). Uses the standard AWS SDK credential chain (env vars `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`, shared config files, IAM roles). No custom auth flags.
- **Database**: `pg` for connection validation, shells out to `pg_dump`/`pg_restore` for actual operations
- **Runtime**: tsx (consistent with other apps)
- **Validation**: zod
- **Existing code to leverage**: `@ensnode/ensdb-sdk` for schema definitions and metadata access

## CLI Commands

### Inspect

```
ensdb-cli inspect [--ensdb-url <url>]
  List all schemas with type classification and size info.

ensdb-cli inspect [--ensdb-url <url>] --schema <name>
  Show detailed info for a specific schema (tables, row counts, sizes).
```

### Schema Management

```
ensdb-cli schema drop [--ensdb-url <url>] --schema <name> [--force]
  Drop a schema. Requires --force or interactive confirmation.
```

### Snapshot Operations

```
ensdb-cli snapshot create [--ensdb-url <url>] --output <path> [--ignore-schemas <name,...>] [--jobs <n>]
  Export all discovered indexer schemas + ponder_sync + full ensnode schema (ensnode.dump.tar.zst) + ensnode_metadata.json.
  Runs pg_dump with parallel jobs per dumped schema. Use --ignore-schemas to skip unrelated app schemas.

ensdb-cli snapshot restore [--ensdb-url <url>] --input <path> [--drop-existing] [--skip-preflight] [--jobs <n>]
  Full restore: all indexer dumps in the snapshot + ponder_sync + ensnode (from ensnode.dump.tar.zst).
  Omit --schemas. Preflight requires a fresh/isolated target unless `--skip-preflight` is used, or `--drop-existing` is set for the schemas that will be replaced.
  Unpacks archives, then pg_restore with parallel jobs. ensnode_metadata.json is not the source of truth for ensnode.

ensdb-cli snapshot restore [--ensdb-url <url>] --input <path> --schemas <name,...> [--bootstrap-ensnode] [--drop-existing] [--skip-preflight] [--jobs <n>]
  Selective restore into a fresh or isolated database.
  Restores the selected indexer schema dump(s) + ponder_sync when that artifact is present under --input.
  **Clean DB:** either run migrations first, then apply filtered ensnode.metadata from JSON; or pass --bootstrap-ensnode (requires ensnode.dump.tar.zst in --input) to pg_restore ensnode (includes __drizzle_migrations) and prune metadata to --schemas.
  **Shared ensnode:** omit --bootstrap-ensnode; upsert filtered metadata from JSON only.
  Runs preflight before pg_restore; fails if shared state or metadata conflicts unless --skip-preflight.
  Fails if target indexer schema already exists unless --drop-existing is passed (after preflight).
  Unpacks `.dump.tar.zst` archives to temp storage, then runs pg_restore with parallel jobs.

ensdb-cli snapshot restore [--ensdb-url <url>] --input <path> --ponder-sync-only [--drop-existing] [--skip-preflight] [--jobs <n>]
  Restore only ponder_sync (no indexer schemas, no ensnode dump, no ensnode.metadata changes).
  Preflight still applies to non-empty ponder_sync unless --skip-preflight.
  Enables the developer workflow described in #833: quickly bootstrap a local ponder_sync
  so a new indexer can skip RPC re-fetching.

ensdb-cli snapshot push --input <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  Upload a local snapshot to S3-compatible storage. Uses multipart upload.

ensdb-cli snapshot pull --snapshot-id <id> --output <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] [--schemas <name,...>] [--without-ponder-sync]
  Download from S3-compatible storage. If --schemas specified, downloads those indexer dumps + ensnode_metadata.json + ensnode.dump.tar.zst and (by default) ponder_sync.
  pass --without-ponder-sync to skip ponder_sync (trade-offs: restored indexer may re-fetch RPC state).
  If --schemas omitted, downloads the full snapshot.
  --prefix scopes all keys to `{prefix}/{snapshot-id}/...` (same as list/push/info/delete).

ensdb-cli snapshot pull --snapshot-id <id> --output <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] --ponder-sync-only
  Download only ponder_sync.dump.tar.zst from a remote snapshot in S3-compatible storage (#833).
  Skips all indexer schema dumps and ensnode_metadata.json.

ensdb-cli snapshot list --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] [--limit <n>]
  List available snapshots from S3-compatible storage with metadata summary (uses ListObjects + manifest.json).
  Default --limit 20, sorted newest first.

ensdb-cli snapshot info --snapshot-id <id> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  Show detailed metadata for a specific remote snapshot (fetches and displays manifest.json under `{prefix}/{snapshot-id}/`).

ensdb-cli snapshot delete --snapshot-id <id> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] [--force]
  Delete a snapshot and all its artifacts from S3-compatible storage. Requires --force or interactive confirmation.
  Removes all objects under `{prefix}/{snapshot-id}/`.

ensdb-cli snapshot verify --input <path>
  Validate a local snapshot before restore: check manifest shape/version and verify `checksums.sha256`.
  Does not connect to PostgreSQL or modify data.
```

### Common Options

- `--ensdb-url` / `ENSDB_URL` -- PostgreSQL connection string for the source/target ENSDb. Optional; defaults to `process.env.ENSDB_URL`.
- `--jobs` / `-j` -- parallelism for pg_dump/pg_restore (default: 4)
- `--bucket` / `ENSDB_SNAPSHOT_BUCKET` -- S3 bucket name
- `--endpoint` / `ENSDB_SNAPSHOT_ENDPOINT` -- S3-compatible endpoint (for R2, MinIO)
- `--prefix` / `ENSDB_SNAPSHOT_PREFIX` -- key prefix inside the bucket (default empty). All snapshot S3 commands (`push`, `pull`, `list`, `info`, `delete`) must resolve object keys as `{prefix}/{snapshot-id}/...` so behavior matches when omitted (empty prefix) or when a shared prefix is used.
- `--skip-preflight` -- `snapshot restore` only: skip **all** preflight checks (non-empty `ponder_sync`, `ensnode.metadata` conflicts, unexpected schemas, PostgreSQL / Drizzle / ensdb / build-id compatibility). Dangerous; emits a stderr warning. v1 has no narrower “skip only version checks” flag — use this explicitly or fix the target DB first.
- `--verbose` / `-v` -- detailed output

## Manifest Schema

Each snapshot has a `manifest.json`. The CLI auto-populates `indexerConfig` by reading `ensindexer_public_config` from `ensnode.metadata` -- no manual input needed for namespace, plugins, or chain IDs.

**Manifest version check:** On any command that reads a manifest (`snapshot list`, `snapshot restore`, `snapshot info`, `snapshot pull`, `snapshot verify`), the CLI must check the `version` field and fail with a clear error (e.g. "manifest version 2 is not supported by this CLI; upgrade ensdb-cli") if it encounters a version it does not support.

### Deriving capabilities for UI

ENSDb should compute “what this snapshot enables” dynamically at display time from:
- the manifest’s artifact list (which dump files are present)
- each schema’s `indexerConfig` (plugins, namespace, `isSubgraphCompatible`, etc.)

Define a single function (used by `snapshot list` / `snapshot info` output formatting) that implements this deterministic logic:

`deriveCapabilities({ manifest, schemaName? }) -> { flags, intendedUseCases }`

Example outputs (computed, not stored):
- `fastBootstrap: true` (if required artifacts are present to avoid full reindex)
- `includesPonderSync: true` (if `ponder_sync.dump.tar.zst` exists)
- `selectiveRestoreSupported: true` (if `ensnode_metadata.json` exists and schema dumps are per-schema)
- `includesFullEnsnodeSchema: true` (if `ensnode.dump.tar.zst` is present in the manifest)
- `intendedUseCases: ["subgraphCompat", "alpha", "v2", "ciSmokeTests"]` (derived from `indexerConfig`)

```json
{
  "version": 1,
  "snapshotId": "mainnetSchema1.9.0-2026-04-06-abc123",
  "createdAt": "2026-04-06T12:00:00Z",
  "postgresVersion": "16.2",
  "schemas": [
    {
      "name": "mainnetSchema1.9.0",
      "type": "ensindexer",
      "sizeBytes": 45000000000,
      "tableCount": 12,
      "dumpFile": "mainnetSchema1.9.0.dump.tar.zst",
      "indexerConfig": {
        "ensdbVersion": "1.9.0",
        "namespace": "mainnet",
        "plugins": ["subgraph"],
        "indexedChainIds": [1],
        "isSubgraphCompatible": true,
        "labelSet": { "labelSetId": "subgraph", "labelSetVersion": 0 },
        "versionInfo": {
          "ensDb": "1.9.0",
          "ponder": "0.16.3",
          "ensIndexer": "1.9.0"
        }
      }
    }
  ],
  "ponderSync": {
    "sizeBytes": 8000000000,
    "dumpFile": "ponder_sync.dump.tar.zst",
    "chainIdsPresent": [1, 8453]
  },
  "ensnode": {
    "sizeBytes": 65536,
    "dumpFile": "ensnode.dump.tar.zst",
    "drizzleMigrations": {
      "appliedTagsInOrder": ["0000_initial", "0001_..."]
    }
  },
  "metadata": {
    "file": "ensnode_metadata.json",
    "indexerSchemas": ["mainnetSchema1.9.0"]
  },
  "ignoredSchemas": [],
  "totalSizeBytes": 53000000000,
  "checksumFile": "checksums.sha256"
}
```

The `indexerConfig` is extracted from the three `ensnode.metadata` keys:

- `ensdb_version` -- ENSDb version string
- `ensindexer_public_config` -- namespace, plugins, chains, version info, label set, subgraph compatibility
- `ensindexer_indexing_status` -- per-chain sync status (block numbers, timestamps, chain-following state)

This means `snapshot list` can show rich summaries like:

```
Snapshot ID                                  Schemas  Total Size  Created
ensdb-2026-04-06T120000Z-abc123              5        50 GB       2026-04-06
  mainnetSchema1.9.0                           mainnet    subgraph               1 chain
  alphaSchema1.9.0                             alpha      subgraph+basenames+6   6 chains
  sepoliaSchema1.9.0                           sepolia    subgraph               1 chain
  ...
ensdb-2026-04-05T080000Z-def456              3        35 GB       2026-04-05
  ...
```

Each row is a snapshot (not a schema). Schemas are listed as sub-entries.

## Project Structure

```
apps/ensdb-cli/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    cli.ts                          # yargs entry point
    commands/
      inspect.ts                    # inspect command
      schema-drop.ts                # schema drop command
      snapshot-create.ts            # snapshot create
      snapshot-restore.ts           # snapshot restore
      snapshot-push.ts              # push to S3
      snapshot-pull.ts              # pull from S3
      snapshot-verify.ts            # verify local snapshot manifest + checksums
      snapshot-list.ts              # list remote snapshots
      snapshot-info.ts              # remote snapshot info
      snapshot-delete.ts            # delete remote snapshot prefix
    lib/
      database.ts                   # pg connection, schema queries
      preflight-restore.ts          # fresh/isolated DB, conflicts, Drizzle/version/build compatibility before pg_restore
      pgdump.ts                     # pg_dump/pg_restore wrapper
      s3.ts                         # S3-compatible client, multipart upload/download
      manifest.ts                   # manifest read/write, validation
      snapshot.ts                   # snapshot directory management
      checksum.ts                   # checksum generation and verification
    types.ts                        # shared types
```

## Implementation Phases

### Phase 1: Project Setup + Inspect + Schema Drop

- Scaffold `apps/ensdb-cli` with yargs, tsx, vitest
- Implement `inspect` command (re-implement PR #891 cleanly, using `@ensnode/ensdb-sdk` where possible)
- Implement `schema drop` command
- Add to pnpm workspace

### Phase 2: Local Snapshot Create + Restore

- Implement `pg_dump` wrapper with parallel jobs and progress reporting
- Implement `snapshot create` (dump all indexer schemas + ponder_sync + full `ensnode` schema dump + `ensnode_metadata.json` export)
- Implement archive packaging and unpacking for directory-format dumps
- Implement `snapshot restore` (preflight in `preflight-restore.ts`, full + selective + `--bootstrap-ensnode` path, then pg_restore / metadata prune / JSON upsert)
- Manifest generation and validation
- Checksum generation and verification

### Phase 3: S3-compatible Push + Pull + List + Delete

- S3-compatible client with multipart upload support
- Shared helper: resolve `{prefix}/{snapshot-id}/` from `--prefix` / `ENSDB_SNAPSHOT_PREFIX` for every snapshot S3-compatible command (`push`, `pull`, `list`, `info`, `delete`)
- `snapshot push` with manifest and artifact upload only
- `snapshot pull` with integrity verification (optionally add `--resumable` + `.part` downloads + retries)
- `snapshot list` and `snapshot info` for browsing remote snapshots
- `snapshot delete` (list objects under prefix, batch delete, `--force` / confirmation)

### Phase 4: Polish + Production Readiness

- Dockerfile (include `postgresql-client` for pg_dump/pg_restore)
- Progress bars for large operations
- `snapshot verify --input <path>` command: verify local snapshot integrity (checksums) without restoring
- Dry-run mode for destructive operations
- Comprehensive error messages and recovery guidance
- Documentation

## CI Test Matrix Support (#1127)

The snapshot infrastructure directly enables the matrix smoke tests described in [#1127](https://github.com/namehash/ensnode/issues/1127). The production database contains indexer schemas with three distinct configurations that map to the test matrix:

- **Subgraph-compat**: `mainnetSchema1.9.0` (plugins: `["subgraph"]`, `isSubgraphCompatible: true`)
- **Alpha-style**: `alphaSchema1.9.0` (plugins: `["subgraph","basenames","lineanames","threedns",...]`, `isSubgraphCompatible: false`)
- **V2**: `v2SepoliaSchema1.9.0` (plugins: `["ensv2","protocol-acceleration"]`, `isSubgraphCompatible: false`)

The manifest's `indexerConfig` on each schema entry includes `plugins`, `namespace`, `isSubgraphCompatible`, and `indexedChainIds`, which provides enough information for CI to select the correct schema for each test variant.

**CI workflow pattern:**

```
# 1. Pull only the schema needed for this matrix entry
ensdb-cli snapshot pull \
  --snapshot-id <latest> \
  --schemas mainnetSchema1.9.0 \
  --bucket $ENSDB_SNAPSHOT_BUCKET \
  --output /tmp/snapshot

# 2a. Restore into an isolated empty test database (bootstrap ensnode + Drizzle migrations from snapshot)
ensdb-cli snapshot restore \
  --ensdb-url $TEST_DB_URL \
  --input /tmp/snapshot \
  --schemas mainnetSchema1.9.0 \
  --bootstrap-ensnode

# 2b. Alternative: run ENSDb migrations against $TEST_DB_URL first, then restore without --bootstrap-ensnode

# 3. Run smoke tests against the restored database
ENSDB_URL=$TEST_DB_URL ENSINDEXER_SCHEMA_NAME=mainnetSchema1.9.0 pnpm test:smoke
```

Each matrix entry pulls and restores a different schema, then runs ENSApi smoke tests against it. The selective pull avoids downloading every indexer dump — only the chosen schema, `ponder_sync`, `ensnode.dump.tar.zst` (always included; negligible size), and `ensnode_metadata.json`.

The `snapshot list` and `snapshot info` commands can also be used in CI to discover the latest available snapshot ID before pulling.

## Future Roadmap

### Analytical Queries (#279)

[#279](https://github.com/namehash/ensnode/issues/279) requires counting Unknown Names and Unknown Labels by iterating through domain data. This will be a separate **`analyze`** command, not part of **`inspect`**.

**Why separate from `inspect`:**

- `inspect` stays fast (milliseconds) -- it reads only `information_schema`, `pg_stat_user_tables`, and `ensnode.metadata`.
- `analyze` performs heavy table scans over potentially millions of domain rows (seconds to minutes at 50-100GB scale). Mixing slow analytical queries into `inspect` would make it unpredictably slow.
- The output shape is different: `inspect` shows schema structure and metadata; `analyze` produces statistical reports with their own formatting and flags (e.g. `--top-n`, `--output-format`).
- `analyze` becomes a natural home for future heavy queries (domain distribution by chain, registration trends, label healing coverage).

`inspect --schema <name>` may include a lightweight `Domain count` line from `pg_stat_user_tables.n_live_tup` (free, approximate) as a hint, but the deep scan stays in `analyze`.

**Future command:**

```
ensdb-cli analyze unknown-labels [--ensdb-url <url>] --schema <name> [--top-n 100] [--output-format table|csv|json]
  Count unknown names, unknown labels (distinct and non-distinct),
  and return the top-N most frequent unknown labels with occurrence counts.
  Uses @ensnode/ensdb-sdk typed access to domain tables.
  Supports progress reporting for long-running scans.
```

The snapshot create/restore workflow enables **offline analysis**: snapshot production, restore into an isolated database, run analysis without impacting production. The `ensindexer_public_config` metadata (available in manifests) identifies which schemas are subgraph-compatible, which is relevant to #279 since the metrics are anchored to the ENS Subgraph definition of Unknown Labels.

This is explicitly **out of scope for v1** but the plan ensures the CLI's database access layer (`lib/database.ts`, `@ensnode/ensdb-sdk` integration) is designed to support it.

## Resolved Decisions

1. **Discovery**: No shared `index.json`. Use S3-compatible `ListObjects` to discover snapshots by reading `manifest.json` from each snapshot prefix. Most robust -- no concurrent writer races, no stale index.
2. **Snapshot granularity**: `snapshot create` dumps all discovered indexer deployment schemas + `ponder_sync` + **full `ensnode` schema** (`ensnode.dump.tar.zst`) + `ensnode_metadata.json`, with optional `--ignore-schemas` for unrelated app schemas. **Full** `snapshot pull` / `snapshot restore` include the `ensnode` dump. **Selective** `pull` always includes `ensnode.dump.tar.zst` (negligible size). **Selective** `restore` either **upserts** metadata from JSON onto an existing migrated `ensnode`, or uses **`--bootstrap-ensnode`** to `pg_restore` the dump and prune metadata to `--schemas` so `__drizzle_migrations` matches the snapshot.
3. **Restore safety**: `snapshot restore` assumes a fresh or isolated database; **preflight** enforces this (non-empty `ponder_sync`, conflicting `ensnode.metadata` rows, unexpected schemas, version compatibility) unless **`--skip-preflight`** is passed.
4. **Restore behavior**: Preflight runs first, then fail if a target indexer schema already exists unless `--drop-existing` is passed. `--drop-existing` does not bypass preflight but **suppresses non-empty checks** for schemas it will drop; only **`--skip-preflight`** bypasses all checks. Prevents accidental data loss while keeping an explicit escape hatch.
5. **`--drop-existing` scope**: Full restore drops all indexer schemas + `ponder_sync` + `ensnode`. Selective restore drops named `--schemas` targets + `ponder_sync` (when being restored) + `ensnode` (when `--bootstrap-ensnode` is set).
6. **`ponder_sync` default**: Included by default for selective restore. Opt out with `--without-ponder-sync`.
7. **`--bootstrap-ensnode` + `--drop-existing`**: When both are set and `ensnode` already exists, `--drop-existing` drops `ensnode` before bootstrap restore.
8. **Retention policy**: `snapshot delete` command added for manual cleanup. `snapshot list` shows all snapshots; operators manage retention manually.
9. **Snapshot IDs**: Snapshot IDs are auto-generated and immutable in v1 (no operator override).
10. **Streaming uploads**: v1 stays local-first (`snapshot create` then `snapshot push`). No streaming/pipe-to-S3 mode in v1.

   **Rationale (kept for future roadmap):**

   - **Why directory format complicates streaming:** `pg_dump --format=directory` writes many files under a tree; you normally archive that tree to a single blob (e.g. `.dump.tar.zst`) before upload. That implies at least one local staging step per schema unless you stream `tar` output directly to S3 multipart (possible but more moving parts).
   - **Other `pg_dump` formats do not remove all constraints:**
     - **Custom** (`pg_dump --format=custom` / `-Fc`): single-file output and can be streamed (e.g. piped into multipart upload). Loses parallel `pg_restore` compared to directory format unless you accept those trade-offs at 50-100GB scale.
     - **Plain** (`pg_dump --format=plain`): single SQL stream; stream-friendly, but restore is typically slower and less suited to huge DBs than the directory workflow already chosen for this plan.
   - **Checksums and manifest:** The plan includes `checksums.sha256` and a `manifest.json` with per-artifact sizes. For end-to-end streaming without a local file:
     - Per-artifact SHA-256 can still be computed by hashing bytes as they pass through the upload pipeline (digest alongside the stream), then writing the digest into `checksums.sha256` and the manifest after that artifact finishes.
     - Alternatively, S3 object checksums (multipart part ETags, or `ChecksumSHA256` on `PutObject` where supported) can supplement or replace client-side files, but the manifest must state what is verified (client hash vs object checksum).
     - The full snapshot manifest cannot be finalized until all artifacts are complete, so uploads can be incremental, but manifest upload is always last (or use a two-phase manifest: provisional then final).

## Open Questions for Stakeholders

1. **Snapshot ID format**: Confirm the exact auto-generated format (e.g. `ensdb-YYYY-MM-DDTHHMMSSZ-<shortHash>` vs `{primarySchemaName}-...`). v1 does not allow overriding the generated ID.
2. **Clean DB selective restore default for CI/docs:** Prefer **migrate-first** (requires running the repo migration command with a matching ENSDb version) or **`--bootstrap-ensnode`** (self-contained from snapshot; `ensnode.dump.tar.zst` is always present in pulled snapshots)?
3. **ponder_sync chain IDs:** Is there a stable, canonical way to derive `ponderSync.chainIdsPresent` from the current `ponder_sync` schema (table/column to read), or should the CLI treat this as a purely best-effort hint with no guarantees?
4. **pg_dump parallel jobs:** Is `pg_dump --format=directory --jobs=N` actually faster than single-threaded dump for our schemas? Each indexer schema has ~12 tables, so parallelism across tables within a single schema may yield limited benefit. Benchmark before committing to directory format as the only path — `pg_dump --format=custom` (single file, no parallel restore) would simplify the archive/unpack pipeline significantly. If directory format is not measurably faster, consider switching to custom format for v1.
5. **v1 scope: empty-database-only restore?** If `snapshot restore` only targets **empty databases**, the entire preflight matrix (non-empty `ponder_sync`, `ensnode` conflicts, unexpected schemas, `--drop-existing`, version/Drizzle/build compatibility checks) collapses to a single "is the DB empty?" check. This removes `--drop-existing`, `--skip-preflight`, and the preflight-aware `--drop-existing` suppression logic. Trade-off: operators who want to restore into an existing database would need to wipe it first (outside the CLI) or wait for a future version.
6. **v1 scope: full-snapshot-only restore (no `--schemas`)?** If selective restore is deferred to v2, the restore command becomes trivial: `pg_restore` every dump in the snapshot. This eliminates `--schemas`, `--bootstrap-ensnode`, the JSON upsert path, metadata pruning, and open question 2. `--ponder-sync-only` can remain as a simple special case for #833. Trade-off: CI test matrix (#1127) would need to restore full snapshots for each matrix entry (expensive) or create separate smaller snapshots per test config. If question 5 is also "yes," the restore command has **zero flags** (besides `--ensdb-url` and `--input`).
