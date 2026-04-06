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
    content: "Implement snapshot create: dump all indexer schemas + ponder_sync + full ensnode.metadata, then generate manifest + checksums"
    status: pending
  - id: snapshot-restore
    content: "Implement snapshot restore: unpack selected archives, validate manifest, pg_restore with parallel jobs, and restore filtered metadata rows into a fresh or isolated database"
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

## Architecture Decisions

### Snapshot Composition

A snapshot always contains:

1. **All current indexer schemas** from the source database
2. The **full `ponder_sync`** schema
3. The **full `ensnode.metadata`** table contents

Selective workflows happen later:

1. `snapshot pull --schemas ...` downloads only the selected indexer schema archives plus shared artifacts
2. `snapshot restore --schemas ...` restores only those selected indexer schemas and filters `ensnode.metadata` rows to match

Because `ponder_sync` is shared state, `snapshot restore` is intended for **fresh or isolated target databases only**. Restoring a partial snapshot into an already-used shared database is out of scope for the first version.

### Snapshot Format

Use `**pg_dump --format=directory`** with `**--jobs=N`** for parallel dump/restore. This is the only format that supports parallelism, which is critical for 50-100GB databases. Each directory-format dump is then archived as a `**.dump.tar.zst`** artifact for storage and transfer, and unpacked to a temporary directory before restore.

- Dump: `pg_dump --format=directory --jobs=4 --schema=<name> --file <tmp>/<schema>.dumpdir`
- Archive: `tar --zstd -cf <snapshot>/<schema>.dump.tar.zst -C <tmp> <schema>.dumpdir`
- Restore: unpack `<schema>.dump.tar.zst` to a temp directory, then run `pg_restore --format=directory --jobs=4 --schema=<name> <tmp>/<schema>.dumpdir`

The implementation should explicitly budget temporary disk usage for both the compressed archive and the unpacked directory during restore.

### S3 Storage Layout

Discovery via `ListObjects` on `{prefix}/` -- each snapshot is a prefix containing a `manifest.json` and per-schema dump files:

```
{prefix}/
  {snapshot-id}/
    manifest.json                     # snapshot metadata (all schemas, sizes, versions)
    {schema-name}.dump.tar.zst        # archived pg_dump directory output (one per indexer schema)
    ponder_sync.dump.tar.zst          # archived pg_dump of ponder_sync
    ensnode_metadata.json             # all ensnode.metadata rows
    checksums.sha256                  # integrity verification
```

- `snapshot list` uses `ListObjectsV2` with delimiter `/` to enumerate snapshot prefixes, then fetches each `manifest.json` for metadata display.
- `snapshot pull` downloads only the selected schema dump(s) + `ponder_sync.dump.tar.zst` + `ensnode_metadata.json` (CLI filters metadata rows locally to match selected schemas during restore).

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
ensdb-cli inspect --database-url <url>
  List all schemas with type classification and size info.

ensdb-cli inspect --database-url <url> --schema <name>
  Show detailed info for a specific schema (tables, row counts, sizes).
```

### Schema Management

```
ensdb-cli schema drop --database-url <url> --schema <name> [--force]
  Drop a schema. Requires --force or interactive confirmation.
```

### Snapshot Operations

```
ensdb-cli snapshot create --database-url <url> --output <path>
  Export ALL indexer schemas + ponder_sync + all ensnode.metadata to a local snapshot.
  Runs pg_dump with parallel jobs for each schema.

ensdb-cli snapshot restore --database-url <url> --input <path> --schemas <name,...> [--drop-existing]
  Restore selected schema(s) from a local snapshot into a fresh or isolated database.
  Restores the selected indexer schema dump(s) + ponder_sync + filtered ensnode.metadata rows.
  Fails if target schema already exists unless --drop-existing is passed.
  Unpacks `.dump.tar.zst` archives to temp storage, then runs pg_restore with parallel jobs.

ensdb-cli snapshot push --input <path> --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  Upload a local snapshot to S3-compatible storage. Uses multipart upload.

ensdb-cli snapshot pull --snapshot-id <id> --output <path> --bucket <bucket> [--endpoint <url>] [--schemas <name,...>]
  Download from S3. If --schemas specified, downloads only those schema dumps + shared artifacts.
  If --schemas omitted, downloads the full snapshot.

ensdb-cli snapshot list --bucket <bucket> [--endpoint <url>] [--prefix <prefix>]
  List available snapshots from S3 with metadata summary (uses ListObjects + manifest.json).

ensdb-cli snapshot info --snapshot-id <id> --bucket <bucket> [--endpoint <url>]
  Show detailed metadata for a specific remote snapshot (fetches and displays manifest.json).
```

### Common Options

- `--database-url` / `ENSDB_URL` -- PostgreSQL connection string
- `--jobs` / `-j` -- parallelism for pg_dump/pg_restore (default: 4)
- `--bucket` / `ENSDB_SNAPSHOT_BUCKET` -- S3 bucket name
- `--endpoint` / `ENSDB_SNAPSHOT_ENDPOINT` -- S3-compatible endpoint (for R2, MinIO)
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
    lib/
      database.ts                   # pg connection, schema queries
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
- Implement `snapshot restore` (fresh or isolated database only, pg_restore with parallel jobs)
- Manifest generation and validation
- Checksum generation and verification

### Phase 3: S3 Push + Pull + List

- S3 client with multipart upload support
- `snapshot push` with manifest and artifact upload only
- `snapshot pull` with integrity verification
- `snapshot list` and `snapshot info` for browsing remote snapshots

### Phase 4: Polish + Production Readiness

- Dockerfile (include `postgresql-client` for pg_dump/pg_restore)
- Progress bars for large operations
- Dry-run mode for destructive operations
- Comprehensive error messages and recovery guidance
- Documentation

## Resolved Decisions

1. **Discovery**: No shared `index.json`. Use S3 `ListObjects` to discover snapshots by reading `manifest.json` from each snapshot prefix. Most robust -- no concurrent writer races, no stale index.
2. **Snapshot granularity**: `snapshot create` always dumps ALL indexer schemas + `ponder_sync` + all `ensnode.metadata`. `snapshot pull` and `snapshot restore` let the user select which indexer schema(s) they want from that full snapshot.
3. **Restore safety**: `snapshot restore` targets a fresh or isolated database only because `ponder_sync` is shared state. Partial restore into an already-used shared database is not supported in v1.
4. **Restore behavior**: Fail by default if a target schema already exists. Pass `--drop-existing` to drop and replace. Prevents accidental data loss while keeping the convenient path available.

## Open Questions for Stakeholders

1. **Snapshot ID format**: Should snapshot IDs be auto-generated (e.g. `ensdb-2026-04-06-abc123`) or user-specified? Auto-generated is safer for avoiding collisions.
2. **Retention policy**: Should `snapshot list` show all snapshots ever, or should there be a TTL/cleanup mechanism (e.g. `snapshot delete`)?
3. **Streaming upload mode**: Should v1 support a direct "snapshot and push" flow that uploads artifacts to S3 as they are produced, or should v1 stay local-first (`snapshot create` then `snapshot push`)? True end-to-end streaming likely conflicts with the chosen `pg_dump --format=directory` approach, so supporting it may require either a different dump format or a hybrid design where each completed schema archive is uploaded immediately after local creation.
