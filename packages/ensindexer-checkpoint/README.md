# @ensnode/ensindexer-checkpoint

Bash orchestration to produce ENSIndexer **checkpoints** on disposable Cherry Servers hardware and
load them into target ENSDb instances — cutting a full index from ~1 week to ~6 hours.

A run spins up a bare-metal Ryzen box, rehydrates the `ponder_sync` cache from R2, indexes a commit
with real ENSRainbow heals, exports the output schema (custom-format dump + ENSNode metadata) to R2,
optionally loads it into a target Postgres, and tears the box down. The box is **disposable** — it
holds nothing durable; R2 holds the seed + checkpoints.

These scripts are driven by the GitHub workflows (`index_checkpoint_and_deploy.yml`, `checkpoint.yml`)
and can also be run manually via `checkpoint.sh`.

## Two modes

- **`full-backfill`** (production warm-start): index a config to the live finalized tip, then
  graceful-stop. Because the box runs the **exact** production env (no `END_BLOCK_*`), Ponder's
  `build_id` matches a deployed service with the same config, so the loaded schema **resumes** rather
  than re-indexing. The alpha run also refreshes the canonical R2 seed with the freshly-fetched tail.
- **`end-block`** (developer checkpoint): index deterministically to per-chain end blocks resolved
  from a target `timestamp` (zero-RPC if the seed covers it). Produces a resumable point-in-time
  checkpoint for local debugging.

## Build-ID parity contract (the load-bearing invariant)

The box MUST run the same indexing identity as the deployed service, or the warm schema won't resume.
That identity is sourced from the committed, single-source-of-truth env files:

- `apps/ensindexer/configs/alpha.env` (mainnet namespace, all alpha plugins **+ efp**, searchlight/1)
- `apps/ensindexer/configs/mainnet.env` (subgraph-compatible)

`remote-run.sh` sources `apps/ensindexer/configs/<CONFIG>.env` for `NAMESPACE`/`PLUGINS`/labelset and
adds only deployment-specific runtime vars. The deployed Railway service must use the same identity.

## Layout

- `scripts/config.example.sh` — every value via env; copy to `config.sh` (gitignored) for manual runs.
  **No secrets are committed.** Cherry plan/region are hardcoded; ALCHEMY/R2/Cherry creds come from
  the environment (GitHub secrets in CI).
- `scripts/lib.sh` — ssh/scp to the box, R2 path + lock helpers, write-tuned postgres lifecycle.
- `scripts/cherry-up.sh` / `cherry-down.sh` — provision/terminate the box (cherry-up arms an on-box
  self-destruct watchdog so the box dies even if the runner does).
- `scripts/remote-provision.sh` — install node24/pnpm/pg17/rclone on a fresh box.
- `scripts/remote-rehydrate.sh` — mount NVMe, init a write-heavy postgres cluster, restore the R2 seed.
- `scripts/remote-run.sh` — index a config to `is_ready=1`, then graceful-stop (full-backfill or
  end-block mode).
- `scripts/remote-resolve-end-blocks.sh` — `timestamp` → per-chain `END_BLOCK_<chainId>` (end-block mode).
- `scripts/remote-checkpoint.sh` — on-box orchestrator: lock → produce-or-reuse checkpoint → load → seed.
- `scripts/remote-seed-export.sh` — dump the enriched `ponder_sync` → canonical R2 seed (alpha only).
- `scripts/detect-done.sh` — authoritative completion signal (`_ponder_meta.app.is_ready` 0→1).
- `scripts/checkpoint.sh` — manual end-to-end runner (up → ship → provision → run → down).

## R2 layout

```
<R2_CHECKPOINTS_BUCKET>/
  seed/ponder_sync.dump                       # canonical zero-RPC cache (refreshed by alpha runs)
  checkpoints/<config>-<sha>[-t<ts>].dump      # sha-keyed checkpoint + .metadata.json sidecar
  locks/<config>-<sha>[-t<ts>].lock            # best-effort run lock (GH concurrency is the hard one)
```

## Safety

The box is never left running, even on crash: (1) `cherry-down.sh` in an `if: always()` teardown,
(2) an on-box self-destruct watchdog (`SELF_DESTRUCT_HOURS`), and (3) a scheduled reaper workflow that
terminates any `ensindexer-checkpoint-*` box past its TTL.
