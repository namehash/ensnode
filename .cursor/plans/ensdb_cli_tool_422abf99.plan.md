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
    content: "Implement snapshot create: dump discovered indexer schemas + ponder_sync + full ensnode schema + ensnode_metadata.json, then generate manifest + checksums"
    status: pending
  - id: snapshot-restore
    content: "Implement snapshot restore: preflight-restore checks, unpack archives, validate manifest, pg_restore + filtered metadata upsert"
    status: pending
  - id: s3-client
    content: Implement S3 client layer with multipart upload/download support
    status: pending
  - id: snapshot-push
    content: "Implement snapshot push: upload snapshot artifacts and manifest to S3-compatible storage"
    status: pending
  - id: snapshot-pull
    content: "Implement snapshot pull: download from S3, verify checksums"
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
  - `ensnode` -- metadata table (rows scoped by `ens_indexer_schema_name`)
  - `ponder_sync` -- shared RPC cache and sync state (needed by every indexer)

Schema names are set via `ENSINDEXER_SCHEMA_NAME` env var in the blue-green deploy workflow (`[.github/workflows/deploy_ensnode_blue_green.yml](.github/workflows/deploy_ensnode_blue_green.yml)`). Old schemas are orphaned on redeploy and must be dropped manually to reclaim space.

The goal is to enable fast ENSNode bootstrap (hours instead of 2-3 days) by snapshotting and restoring database state.

### Related Issues

- [#833](https://github.com/namehash/ensnode/issues/833) -- Simplify downloading of `ponder_sync` for internal developers. The CLI's `snapshot pull` and `snapshot restore` commands directly address this by supporting selective download of just `ponder_sync` from a remote snapshot.
- [#1127](https://github.com/namehash/ensnode/issues/1127) -- Matrix ENSApi smoke tests across subgraph-compat, alpha-style, and v2 configs. The CLI's snapshot infrastructure enables setting up isolated test databases with specific indexer configurations for CI smoke testing. See "CI Test Matrix Support" section below.
- [#279](https://github.com/namehash/ensnode/issues/279) -- Count Unknown Names & Unknown Labels. A future roadmap extension: the CLI's database access and inspect infrastructure can be extended with an `analyze` command to compute analytical metrics over indexed data. See "Future Roadmap" section below.

## Architecture Decisions

### Snapshot Composition

A full snapshot contains **separate pg_dump archives** for:

1. **Every indexer deployment schema** currently present in the database (e.g. `mainnetSchema1.9.0`, `alphaSchema1.9.0`). The CLI discovers these by enumerating non-system schemas and **excluding** `ponder_sync`, `ensnode`, and PostgreSQL system schemas. If unrelated application schemas exist in the same database, add `--exclude-schemas` (or an allowlist flag) so they are not dumped by mistake.
2. The `ponder_sync` schema (full)
3. The `ensnode` schema (full), not only the `metadata` table

Additionally, the snapshot includes `ensnode_metadata.json`: a JSON export of all rows from `ensnode.metadata`. This supports manifest enrichment, `snapshot list` summaries, and **selective restore** (replay only the metadata rows for chosen indexer schema names without requiring a second full `ensnode` download when operators use the slim pull path).

Selective workflows:

1. `snapshot pull --schemas ...` downloads the selected indexer archives + `ponder_sync` + `ensnode_metadata.json` (+ optionally full `ensnode.dump.tar.zst` when a full `ensnode` restore is required -- see implementation note below)
2. `snapshot restore --schemas ...` restores the selected indexer schema dumps + `ponder_sync`, then applies **filtered** `ensnode.metadata` rows (from JSON or from a partial upsert strategy) so other indexers' metadata rows are not overwritten incorrectly

Because `ponder_sync` is shared state, `snapshot restore` is intended for **fresh or isolated target databases only**. The CLI enforces that with **preflight checks** (below) instead of relying on operator discipline alone.

**Implementation note:** For a **full** restore of everything, restore `ponder_sync`, `ensnode` (from `ensnode.dump.tar.zst`), and each indexer schema. For **selective** restore, the CLI may restore indexer schema(s) + `ponder_sync` and upsert only the relevant metadata rows from `ensnode_metadata.json` instead of replacing the entire `ensnode` schema, to avoid clobbering metadata for indexers not being restored. Exact mechanics should be validated against how Drizzle/Ponder expect `ensnode` to look after restore.

### Preflight checks (`snapshot restore`)

Runs in the **restore command handler** immediately after validating CLI args and loading the manifest, and **before** any `pg_restore` and **before** evaluating `--drop-existing` for target indexer schemas.

**Checks (fail closed by default):**

1. **ponder_sync non-empty:** If schema `ponder_sync` exists, detect any user data (e.g. `SELECT EXISTS (SELECT 1 FROM ponder_sync.<representative_table> LIMIT 1)` or sum `n_live_tup` from `pg_stat_user_tables` for `ponder_sync`). If non-empty, fail with identifier `ENSDB_CLI_ERR_PREFLIGHT_PONDER_SYNC_NONEMPTY` (human-readable message explains shared sync state would be overwritten).
2. **ensnode.metadata conflicts:** Query `ensnode.metadata` if the schema exists. For **selective** restore (`--schemas`), fail if any row exists whose `ens_indexer_schema_name` is **not** in the target schema set (`ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_METADATA_CONFLICT`). For **full** restore (all indexer schemas + full `ensnode` from dump), fail if **any** metadata rows exist (`ENSDB_CLI_ERR_PREFLIGHT_ENSNODE_METADATA_NONEMPTY`) — distinct message from selective conflict so operators know which case fired.
3. **Unexpected non-system schemas / objects:** Enumerate schemas outside PostgreSQL system namespaces (`pg_*`, `information_schema`, etc.). For the intended restore set, fail if a **non-target indexer schema** already exists (tables present or schema present) (`ENSDB_CLI_ERR_PREFLIGHT_UNEXPECTED_SCHEMA`). Optionally extend with a stricter mode: fail if `public` (or other default) contains unexpected user tables — keep the rule deterministic in code and documented.

**Override:** Pass `--force-or-confirm` to skip these preflight failures and proceed (operator asserts the target is disposable or they accept clobbering). Implementation may require interactive confirmation when TTY is available; non-interactive mode requires the flag. This is separate from `--drop-existing`, which only governs dropping **named target indexer schemas** (and optionally `ponder_sync` / `ensnode` if explicitly documented) **after** preflight passes or is overridden.

**Order of operations:**

1. Preflight (unless skipped via `--force-or-confirm`)
2. If restoring indexer schemas and targets exist: apply `--drop-existing` drops for those schemas only (as today)
3. `pg_restore` / metadata upsert

**Surfacing errors:** Print distinct messages per failure class; include the `ENSDB_CLI_ERR_PREFLIGHT_*` identifier in the message (and optionally `process.exit` with dedicated codes, e.g. `2` / `3` / `4`, if the team wants scriptable CI — document in README).

**Selective restore:** Preflight must ensure metadata upsert will not clobber other indexers: the `ensnode.metadata` row check above is mandatory before replaying filtered `ensnode_metadata.json`.

### Snapshot Format

Use `pg_dump` with `--format=directory` and `--jobs=N` for parallel dump/restore. This is the only format that supports parallelism, which is critical for 50-100GB databases. Each directory-format dump is then archived as a `<schema>.dump.tar.zst` file for storage and transfer, and unpacked to a temporary directory before restore.

- Dump: `pg_dump --format=directory --jobs=4 --schema=<name> --file <tmp>/<schema>.dumpdir`
- Archive: `tar --zstd -cf <snapshot>/<schema>.dump.tar.zst -C <tmp> <schema>.dumpdir`
- Restore: unpack `<schema>.dump.tar.zst` to a temp directory, then run `pg_restore --format=directory --jobs=4 --schema=<name> <tmp>/<schema>.dumpdir`

The implementation should explicitly budget temporary disk usage for both the compressed archive and the unpacked directory during restore.

**Tooling prerequisites:** Archiving uses `tar` with zstd compression (`tar --zstd` or pipe to `zstd`). The Docker image and operator docs must include `tar`, `zstd`, and PostgreSQL client tools (`pg_dump`, `pg_restore`) compatible with the server major version.

### S3 Storage Layout

Discovery via `ListObjects` on `{prefix}/` -- each snapshot is a prefix containing a `manifest.json` and per-schema dump files:

```
{prefix}/
  {snapshot-id}/
    manifest.json                     # snapshot metadata (all schemas, sizes, versions)
    {schema-name}.dump.tar.zst        # archived pg_dump directory output (one per indexer schema)
    ponder_sync.dump.tar.zst          # archived pg_dump of ponder_sync
    ensnode.dump.tar.zst              # archived pg_dump of full ensnode schema
    ensnode_metadata.json             # all ensnode.metadata rows (JSON; for manifest + selective metadata replay)
    checksums.sha256                  # integrity verification
```

- `snapshot list` uses `ListObjectsV2` with delimiter `/` to enumerate snapshot prefixes, then fetches each `manifest.json` for metadata display.
- `snapshot pull --schemas ...` downloads the selected indexer dump(s) + `ponder_sync.dump.tar.zst` + `ensnode_metadata.json`. Downloading `ensnode.dump.tar.zst` is optional for selective restore if metadata replay from JSON is sufficient; include it when doing a full `ensnode` schema restore.

### Technology

- **CLI framework**: yargs (consistent with ENSRainbow's `apps/ensrainbow/src/cli.ts`)
- **S3**: `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` (multipart uploads for large files)
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
ensdb-cli snapshot create [--ensdb-url <url>] --output <path> [--exclude-schemas <name,...>]
  Export all discovered indexer schemas + ponder_sync + full ensnode schema + ensnode.metadata JSON.
  Runs pg_dump with parallel jobs for each schema. Use --exclude-schemas to skip unrelated app schemas.

ensdb-cli snapshot restore [--ensdb-url <url>] --input <path> --schemas <name,...> [--drop-existing] [--force-or-confirm]
  Restore selected schema(s) from a local snapshot into a fresh or isolated database.
  Restores the selected indexer schema dump(s) + ponder_sync + filtered ensnode.metadata rows.
  Runs preflight (see above) before pg_restore; fails if shared state or metadata conflicts unless --force-or-confirm.
  Fails if target indexer schema already exists unless --drop-existing is passed (after preflight).
  Unpacks `.dump.tar.zst` archives to temp storage, then runs pg_restore with parallel jobs.

ensdb-cli snapshot restore [--ensdb-url <url>] --input <path> --ponder-sync-only [--drop-existing] [--force-or-confirm]
  Restore only ponder_sync (no indexer schemas, no ensnode.metadata).
  Preflight still applies to non-empty ponder_sync unless --force-or-confirm.
  Enables the developer workflow described in #833: quickly bootstrap a local ponder_sync
  so a new indexer can skip RPC re-fetching.

ensdb-cli snapshot push --input <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  Upload a local snapshot to S3-compatible storage. Uses multipart upload.

ensdb-cli snapshot pull --snapshot-id <id> --output <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] [--schemas <name,...>] [--with-ensnode-schema]
  Download from S3. If --schemas specified, downloads those indexer dumps + ponder_sync + ensnode_metadata.json;
  pass --with-ensnode-schema to also fetch ensnode.dump.tar.zst for a full ensnode pg_restore.
  If --schemas omitted, downloads the full snapshot (all artifacts).
  --prefix scopes all keys to `{prefix}/{snapshot-id}/...` (same as list/push/info/delete).

ensdb-cli snapshot pull --snapshot-id <id> --output <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] --ponder-sync-only
  Download only ponder_sync.dump.tar.zst from a remote snapshot (#833).
  Skips all indexer schema dumps and ensnode_metadata.json.

ensdb-cli snapshot list --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  List available snapshots from S3 with metadata summary (uses ListObjects + manifest.json).

ensdb-cli snapshot info --snapshot-id <id> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  Show detailed metadata for a specific remote snapshot (fetches and displays manifest.json under `{prefix}/{snapshot-id}/`).

ensdb-cli snapshot delete --snapshot-id <id> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>] [--force]
  Delete a snapshot and all its artifacts from S3. Requires --force or interactive confirmation.
  Removes all objects under `{prefix}/{snapshot-id}/`.
```

### Common Options

- `--ensdb-url` / `ENSDB_URL` -- PostgreSQL connection string for the source/target ENSDb. Optional; defaults to `process.env.ENSDB_URL`.
- `--jobs` / `-j` -- parallelism for pg_dump/pg_restore (default: 4)
- `--bucket` / `ENSDB_SNAPSHOT_BUCKET` -- S3 bucket name
- `--endpoint` / `ENSDB_SNAPSHOT_ENDPOINT` -- S3-compatible endpoint (for R2, MinIO)
- `--prefix` / `ENSDB_SNAPSHOT_PREFIX` -- key prefix inside the bucket (default empty). All snapshot S3 commands (`push`, `pull`, `list`, `info`, `delete`) must resolve object keys as `{prefix}/{snapshot-id}/...` so behavior matches when omitted (empty prefix) or when a shared prefix is used.
- `--force-or-confirm` -- snapshot restore only: skip preflight failures (non-empty `ponder_sync`, `ensnode.metadata` conflicts, unexpected schemas). Use only when the operator accepts overwriting shared state.
- `--verbose` / `-v` -- detailed output

## Manifest Schema

Each snapshot has a `manifest.json`. The CLI auto-populates `indexerConfig` by reading `ensindexer_public_config` from `ensnode.metadata` -- no manual input needed for namespace, plugins, or chain IDs.

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
    "dumpFile": "ponder_sync.dump.tar.zst"
  },
  "ensnodeSchema": {
    "sizeBytes": 1200000,
    "dumpFile": "ensnode.dump.tar.zst"
  },
  "metadata": {
    "file": "ensnode_metadata.json",
    "indexerSchemas": ["mainnetSchema1.9.0"]
  },
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
ID                                         Namespace  Plugins                Chains  Created
mainnetSchema1.9.0-2026-04-06-abc123       mainnet    subgraph               1       2026-04-06
alphaSchema1.9.0-2026-04-06-def456         mainnet    subgraph+basenames+6   6       2026-04-06
```

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
      snapshot-list.ts              # list remote snapshots
      snapshot-info.ts              # remote snapshot info
      snapshot-delete.ts            # delete remote snapshot prefix
    lib/
      database.ts                   # pg connection, schema queries
      preflight-restore.ts          # fresh/isolated DB checks before pg_restore
      pgdump.ts                     # pg_dump/pg_restore wrapper
      s3.ts                         # S3 client, multipart upload/download
      manifest.ts                   # manifest read/write, validation
      snapshot.ts                   # snapshot directory management
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
- Implement `snapshot create` (dump all indexer schemas + ponder_sync + full metadata extraction)
- Implement archive packaging and unpacking for directory-format dumps
- Implement `snapshot restore` (preflight in `preflight-restore.ts`, then pg_restore with parallel jobs)
- Manifest generation and validation
- Checksum generation and verification

### Phase 3: S3 Push + Pull + List + Delete

- S3 client with multipart upload support
- Shared helper: resolve `{prefix}/{snapshot-id}/` from `--prefix` / `ENSDB_SNAPSHOT_PREFIX` for every snapshot S3 command (`push`, `pull`, `list`, `info`, `delete`)
- `snapshot push` with manifest and artifact upload only
- `snapshot pull` with integrity verification
- `snapshot list` and `snapshot info` for browsing remote snapshots
- `snapshot delete` (list objects under prefix, batch delete, `--force` / confirmation)

### Phase 4: Polish + Production Readiness

- Dockerfile (include `postgresql-client` for pg_dump/pg_restore)
- Progress bars for large operations
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

# 2. Restore into an isolated test database
ensdb-cli snapshot restore \
  --ensdb-url $TEST_DB_URL \
  --input /tmp/snapshot \
  --schemas mainnetSchema1.9.0

# 3. Run smoke tests against the restored database
ENSDB_URL=$TEST_DB_URL ENSINDEXER_SCHEMA_NAME=mainnetSchema1.9.0 pnpm test:smoke
```

Each matrix entry pulls and restores a different schema, then runs ENSApi smoke tests against it. The selective pull avoids downloading the full 50-100GB snapshot for each matrix entry -- only the relevant schema dump plus `ponder_sync` are transferred.

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

1. **Discovery**: No shared `index.json`. Use S3 `ListObjects` to discover snapshots by reading `manifest.json` from each snapshot prefix. Most robust -- no concurrent writer races, no stale index.
2. **Snapshot granularity**: `snapshot create` dumps all discovered indexer deployment schemas + `ponder_sync` + full `ensnode` schema + `ensnode_metadata.json`, with optional `--exclude-schemas` for unrelated app schemas. `snapshot pull` and `snapshot restore` let the user select which indexer schema(s) they want from that full snapshot; full `ensnode` schema archive is optional on pull when metadata JSON replay is enough.
3. **Restore safety**: `snapshot restore` assumes a fresh or isolated database; **preflight** enforces this (non-empty `ponder_sync`, conflicting `ensnode.metadata` rows, unexpected schemas) unless `--force-or-confirm` is passed.
4. **Restore behavior**: Preflight runs first, then fail if a target indexer schema already exists unless `--drop-existing` is passed. `--drop-existing` does not bypass preflight; only `--force-or-confirm` does. Prevents accidental data loss while keeping an explicit escape hatch.
5. **Retention policy**: `snapshot delete` command added for manual cleanup. `snapshot list` shows all snapshots; operators manage retention manually.
6. **Snapshot IDs**: Snapshot IDs are auto-generated and immutable in v1 (no operator override).
7. **Streaming uploads**: v1 stays local-first (`snapshot create` then `snapshot push`). No streaming/pipe-to-S3 mode in v1.

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

