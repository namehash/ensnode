# @ensnode/ensindexer-checkpoint

Bash orchestration to produce ENSIndexer **checkpoints** on disposable Cherry Servers hardware and
load them into target ENSDb instances — cutting a full index from ~1 week to ~6 hours.

A run spins up a bare-metal Ryzen box, rehydrates the `ponder_sync` cache from R2, indexes a commit
with real ENSRainbow heals, exports each output schema (custom-format dump + ENSNode metadata) to R2,
and tears the box down. The box is **disposable** — it holds nothing durable; R2 holds the seed +
checkpoints.

**The box only _produces_ checkpoints; the _load_ into a target ENSDb runs on the runner afterward**
(`load-checkpoints.sh`), once the box is gone. A restore is bound by the destination Postgres (RAM),
not by this box and not by network IO — it can take hours — so keeping bare metal alive for it is pure
waste. Splitting it also means a load-only re-run (checkpoints already in R2) provisions no box at all.

A run indexes one or more configs **in parallel on a _single_ box**, sharing one Postgres and one
`ponder_sync` cache. Production passes both mainnet-namespace configs (`alpha` + `mainnet`); the dev
checkpoint passes one. Ponder's indexing loop is single-threaded, so multiple configs fit comfortably
on one high-core box — and co-location means the ~200GB `ponder_sync` seed is restored once (not once
per config) and the shared chain-1 RPC tail is fetched once. Each config gets its own Ponder
web-server port (`42069`, `42169`, … by list position), its own ENSRainbow (different labelsets →
different ports `:3223`/`:3224` and data dirs), and its own process group so graceful-stop never
touches a sibling.

The same unified pair drives both flows. The GitHub workflows (`index_checkpoint_and_deploy.yml`,
`checkpoint.yml`) and the manual runner `checkpoint.sh` all invoke the on-box orchestrator
`remote-checkpoint.sh`; production vs dev is just `MODE`/`DO_LOAD`/`DO_SEED` inputs (see Two modes).

## Two modes

- **`full-backfill`** (production warm-start): index a config to the live finalized tip, then
  graceful-stop. Because the box runs the **exact** production identity — same commit/image _and_ env,
  no `END_BLOCK_*` — Ponder's `build_id` matches the deployed service, so the loaded schema **resumes**
  rather than re-indexing (see the Build-ID parity contract below). The alpha run also refreshes the
  canonical R2 seed with the freshly-fetched tail.
- **`end-block`** (developer checkpoint): index deterministically to per-chain end blocks resolved
  from a target `timestamp` (zero-RPC if the seed covers it). Produces a resumable point-in-time
  checkpoint for local debugging.

## Build-ID parity contract (the load-bearing invariant)

The box MUST run the same indexing identity as the deployed service, or the warm schema won't resume.
That identity is sourced from the committed, single-source-of-truth env files:

- `apps/ensindexer/configs/alpha.env` (mainnet namespace, all alpha plugins **+ efp**, searchlight/1)
- `apps/ensindexer/configs/mainnet.env` (subgraph-compatible)

`remote-index-one.sh` sources `apps/ensindexer/configs/<CONFIG>.env` for `NAMESPACE`/`PLUGINS`/labelset
and adds only deployment-specific runtime vars (passed inline as process env — no shared `.env.local`,
since two configs run from the same repo dir). The deployed Railway service must use the same identity.

**`build_id` is environment-specific — it hashes the indexed code, not just the env.** Ponder gates
crash-recovery resume on `_ponder_meta.app.build_id` matching (`ponder/dist/.../database/index.js:498`
throws and crashes on mismatch). The Build ID is derived from the indexing _code/contracts_ plus the
identity above. So a checkpoint **resumes a stock deployed indexer only when it was produced from the
exact same commit/image that the indexer runs.** The production workflow guarantees this by
construction: `index_checkpoint_and_deploy.yml` builds the `sha-<short>` images **from the indexed
commit** and deploys those same images directly (its `deploy-light` / `deploy-heavy` phases, via the
`deploy_railway_services` action) — so the box, the checkpoint, and the deployed image are all the
same SHA.

**Escape hatch (when they differ — patched/cherry-picked checkpoints, or seeding a stock image with a
checkpoint built from a different commit):** the loaded schema will _not_ resume. Either rebuild the
checkpoint from the exact deployed image, or patch the loaded schema to the consuming image's Build ID
and clear the lock. Get the target Build ID by booting the stock image once against a scratch schema
and reading its `_ponder_meta.app.build_id`, then:

```sql
UPDATE "<schema>"._ponder_meta
SET value = jsonb_set(jsonb_set(value, '{build_id}', to_jsonb('<TARGET_BUILD_ID>'::text)),
                      '{is_locked}', to_jsonb(0))
WHERE key = 'app';
```

`enscli`/`ensdb-cli` does not do this automatically — patching forces a resume of a schema Ponder
considers incompatible, so it's a deliberate operator action, not part of the pipeline.

## Layout

- `scripts/config.example.sh` — every value via env; copy to `config.sh` (gitignored) for manual runs.
  **No secrets are committed.** Cherry plan/region are hardcoded; ALCHEMY/R2/Cherry creds come from
  the environment (GitHub secrets in CI).
- `scripts/lib.sh` — ssh/scp to the box, R2 path + lock helpers, write-tuned postgres lifecycle.
- `scripts/cherry-up.sh` / `cherry-down.sh` — provision/terminate the box (cherry-up arms an on-box
  self-destruct watchdog so the box dies even if the runner does).
- `scripts/remote-provision.sh` — install node24/pnpm/pg17/rclone on a fresh box.
- `scripts/remote-rehydrate.sh` — mount NVMe, init a write-heavy postgres cluster, restore the R2 seed.
- `scripts/remote-checkout.sh` — shared cheap setup: stop stale stack, check out the repo @ SHA,
  install deps, build ensdb-cli (no storage/ponder_sync work).
- `scripts/remote-index-one.sh` — index ONE config to `is_ready=1` in an isolated process group on
  caller-assigned ports, then graceful-stop just that config (full-backfill or end-block mode). In
  end-block mode it derives the indexed chain IDs from the config itself.
- `scripts/remote-resolve-end-blocks.sh` — `timestamp` → per-chain `END_BLOCK_<chainId>` (end-block mode).
- `scripts/remote-checkpoint.sh` — the on-box producer: lock → checkout → (for each config whose
  checkpoint is missing) rehydrate once → index all in parallel → dump/upload each → optionally refresh
  seed. Does NOT load (that's the runner's job).
- `scripts/remote-seed-export.sh` — dump the enriched `ponder_sync` → canonical R2 seed.
- `scripts/detect-done.sh` — authoritative completion signal (`_ponder_meta.app.is_ready` 0→1).
- `scripts/load-checkpoints.sh` — **runner-side** load: download each sha-keyed checkpoint from R2 and
  restore it into the target ENSDb as `<config>Schema<VERSION>`. Runs after the box is torn down.
- `scripts/checkpoint.sh` — the unified manual runner: up → ship → provision → produce → down, then
  (if `DO_LOAD=1`) run `load-checkpoints.sh` on this machine. Covers production and dev via
  `CONFIGS`/`MODE`/`DO_LOAD`/`DO_SEED`.

## R2 layout

```
<R2_CHECKPOINTS_BUCKET>/
  seed/ponder_sync.dump                       # canonical zero-RPC cache (refreshed by alpha runs)
  checkpoints/<config>-<sha>[-t<ts>].dump      # sha-keyed checkpoint + .metadata.json sidecar
  locks/<configs>-<sha>[-t<ts>]               # best-effort run lock (GH concurrency is the hard one)
```

## Safety

The box is never left running, even on crash: (1) `cherry-down.sh` in an `if: always()` teardown,
(2) an on-box self-destruct watchdog (`SELF_DESTRUCT_HOURS`), and (3) a scheduled garbage-collector
workflow (`checkpoint_gc.yml`) that terminates any `ensindexer-checkpoint-*` box past its TTL.
