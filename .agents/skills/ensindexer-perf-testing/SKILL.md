---
name: ensindexer-perf-testing
description: >
  Run perf tests on the ENSIndexer (Ponder app under apps/ensindexer). Establishes a clean,
  reproducible baseline by disabling ENSRainbow healing on the hot path
  (DISABLE_ENSRAINBOW_HEAL), isolating the schema, wiping prometheus between runs, and
  snapshotting per-handler metrics at realtime. Use when the user
  asks to compare branches/configs, build a perf baseline, or measure a plugin combination.
---

# ENSIndexer perf testing

Captures wall-clock + per-handler timings for an ENSIndexer run. Always works in the same shape:
configure → disable heal → wipe → start → wait → snapshot → restore.

## Required state before starting

- Postgres at `postgresql://postgres@localhost:5432/ponder` is up.
- ENSRainbow data at `apps/ensrainbow/data/data-subgraph_0/` is hydrated. (The `data-ens-test-env_0/` dir is for ETE; it lacks subgraph labels.)
- Docker daemon is running (for prometheus/grafana sidecars).
- Working tree is clean (perf numbers must come from the branch as committed — no stray edits).

If any of these aren't true, fix that first — don't paper over it.

## Step 1 — start prometheus + grafana

```bash
cd packages/ensindexer-perf-testing && pnpm start
# prometheus :9090, grafana :3001 (anonymous admin)
```

Confirm scrape target is reachable:

```bash
curl -s http://localhost:9090/api/v1/targets?state=active | jq -r '.data.activeTargets[].health'
# should be 'up' once indexer starts
```

## Step 2 — start ENSRainbow (subgraph label set)

ENSIndexer performs an explicit health + ready check against ENSRainbow at startup, so the
service must be running even when healing is disabled. Use the `subgraph` data dir for mainnet
runs:

```bash
cd apps/ensrainbow && \
  DATA_DIR=$PWD/data/data-subgraph_0 PORT=3223 LOG_LEVEL=warn \
  pnpm tsx src/cli.ts serve > /tmp/perf-test/ensrainbow.log 2>&1 &
# wait ~5s, then verify
curl -s http://localhost:3223/health
```

For ens-test-env runs, swap `DATA_DIR=…/data-ens-test-env_0` and set
`LABEL_SET_ID=ens-test-env` in `.env.local`.

## Step 3 — disable ENSRainbow healing

Set the undocumented env var `DISABLE_ENSRAINBOW_HEAL=true` (add it to `.env.local` in Step 4, or
export it before launching). `labelByLabelHash` (`src/lib/graphnode-helpers.ts`) early-returns
`null` — every label is treated as unhealable — giving an apples-to-apples baseline without
ENSRainbow round-trips. No code edit needed.

This changes indexing output: never set it outside perf runs, and always remove it from
`.env.local` at end of run.

## Step 4 — configure `.env.local`

Pick a unique schema per run so concurrent/sequential runs don't pollute each other:

```env
NAMESPACE=mainnet
PLUGINS=ensv2,protocol-acceleration   # or whatever combo
ENSINDEXER_SCHEMA_NAME=ensindexer_perf_<label>
DISABLE_ENSRAINBOW_HEAL=true

ENSRAINBOW_URL=http://localhost:3223
LABEL_SET_ID=subgraph
LABEL_SET_VERSION=0
ENSDB_URL=postgresql://postgres@localhost:5432/ponder
```

`LABEL_SET_ID=subgraph` is required for mainnet runs — `ens-test-env` will fail config
validation against the subgraph label set baseline.

Useful preset combos:

- "alpha": `subgraph,basenames,lineanames,threedns,ensv2,protocol-acceleration,registrars,tokenscope`
- "ensv2": `ensv2,protocol-acceleration`
- "subgraph": `subgraph,basenames,lineanames,threedns,protocol-acceleration`

## Step 5 — wipe state

```bash
PGPASSWORD= psql -U postgres -h localhost -d ponder \
  -c "drop schema if exists ensindexer_perf_<label> cascade;"
cd packages/ensindexer-perf-testing && pnpm wipe   # purges prometheus tsdb
```

## Step 6 — record start, launch indexer

Always use `pnpm start` (production mode) — `pnpm dev` will hot-reload on file changes mid-run
and tank the result. The schema env var must be exported because the start script references
`$ENSINDEXER_SCHEMA_NAME` via shell expansion:

```bash
cd apps/ensindexer
date "+%s" > /tmp/perf-test/main-<label>-start-epoch.txt
date "+%Y-%m-%d %H:%M:%S %z" > /tmp/perf-test/main-<label>-start.txt
ENSINDEXER_SCHEMA_NAME=ensindexer_perf_<label> pnpm start \
  > /tmp/perf-test/main-<label>-indexer.log 2>&1 &
```

Watch the log for these signals:

- `Indexed block range chain=…` lines start within ~10s = healthy
- `ENSRainbow instance is healthy/ready` = config check passed
- Errors (`Cannot find`, `MODULE_NOT_FOUND`, `Invariant(...)`) = abort and triage

## Step 7 — wait for realtime

The indexer is "done" when every chain has transitioned from backfill to live indexing. The
authoritative signal is the indexer log line `Started live indexing chain=<id>` — one per
chain, emitted as that chain crosses from historical to realtime. **Do NOT use prometheus
metrics for this** — current Ponder (0.16.x) does _not_ emit `ponder_sync_is_realtime` or
`ponder_sync_block_target`. A polling script based on those will hang forever.

The expected chain count is derived from the same log: one `Started backfill indexing chain=`
line is emitted per indexed chain at startup. The wait script reads it after the indexer is
healthy and grep-counts the live-indexing lines until they match.

```bash
#!/usr/bin/env bash
set -euo pipefail
LABEL=${1:-run}
LOG=/tmp/perf-test/main-${LABEL}-indexer.log

# Expected chain count = number of "Started backfill indexing chain=" lines.
# Read after the indexer is past startup (give it ~10s).
EXPECTED_CHAINS=$(grep -c "Started backfill indexing chain=" "$LOG" 2>/dev/null || echo 0)
[ "$EXPECTED_CHAINS" -gt 0 ] || { echo "no chains started"; exit 1; }

bail_if_crashed() {
  if grep -qE "unhandledRejection|Started shutdown|index row requires|ELIFECYCLE|Failed to shutdown" "$LOG" 2>/dev/null; then
    echo "INDEXER CRASHED"; tail -50 "$LOG"; exit 99
  fi
}

while true; do
  bail_if_crashed
  count=$(grep -c "Started live indexing chain=" "$LOG" 2>/dev/null || true)
  count=${count:-0}
  echo "$(date '+%H:%M:%S') chains live: $count/$EXPECTED_CHAINS"
  [ "$count" -ge "$EXPECTED_CHAINS" ] && break
  sleep 60
done

date "+%s" > "/tmp/perf-test/main-${LABEL}-end-epoch.txt"
date "+%Y-%m-%d %H:%M:%S %z" > "/tmp/perf-test/main-${LABEL}-end.txt"
```

Notes on EPS shape near the end: as chains finish backfill one-by-one, the instantaneous EPS
_drops_ significantly because fewer chains are concurrently busy. That is expected — not a
regression. Don't bail just because EPS fell from 3000 to 800. Only bail on a crash signature
or a literal lack of progress (no new `Indexed block range` lines for many minutes).

Mainnet alpha-class runs take ~8-15h on this hardware. Set up a single completion notifier:

```bash
until [ -f /tmp/perf-test/main-<label>-end-epoch.txt ]; do sleep 60; done
```

Run that with `run_in_background: true` — one notification when done, no polling.

## Step 8 — snapshot metrics at end-of-run timestamp

Critical: query prometheus _at_ the end-epoch timestamp, not "now". After the indexer shuts
down, scrape stops and instant queries return empty. Always pass `--data-urlencode "time=$TS"`.

Metric units note: `ponder_indexing_function_duration_*` is in **milliseconds**, not seconds.
The metric name no longer carries the `_seconds` suffix it had in older Ponder versions.

```bash
TS=$(cat /tmp/perf-test/main-<label>-end-epoch.txt)
q() {
  curl -sf http://localhost:9090/api/v1/query \
    --data-urlencode "query=$1" --data-urlencode "time=$TS"
}

# What to capture:
q 'ponder_indexing_completed_events'                                    # cumulative event counts
q 'ponder_indexing_function_duration_sum / ponder_indexing_function_duration_count'  # avg ms/event
q 'ponder_indexing_function_duration_sum'                               # total ms wallclock
q 'ponder_indexing_function_duration_count'                             # invocation count
q 'histogram_quantile(0.95, sum by (event, le) (rate(ponder_indexing_function_duration_bucket[5m])))'
q 'sum by (method) (rate(ponder_postgres_query_total[5m]))'             # PG QPS by method
q 'sum by (chain_id) (rate(ponder_rpc_request_cache_hits[5m]))'         # RPC cache hits/s
```

Save each to `/tmp/perf-test/main-<label>-<thing>.json`. Wallclock is `end_epoch -
start_epoch` (whole seconds; computed from the txt files, not from prometheus).

## Step 9 — restore env

Remove `DISABLE_ENSRAINBOW_HEAL` from `.env.local` (or restore from `.env.local.bak-perf-test` if
you backed it up).

Confirm before declaring done — `git status` must show no diff.

**Do NOT drop the run's schema during cleanup.** The user manages schema lifecycle manually — they may want to inspect the indexed data, run queries against it, or compare it with a parallel run. Leave `ensindexer_perf_<label>` in place; the user will `drop schema … cascade` themselves when they're done with it. This applies to both clean-completion teardown and crash teardown.

## Reporting

GitHub issue **#2079** on `namehash/ensnode` is the _only_ canonical store for perf run reports. Post the report as a comment there via `gh issue comment 2079 -R namehash/ensnode --body-file <draft>`.

**Do NOT** also save the report — or a summary of it, or its numbers — to local Claude memory. Memory may hold at most a one-line pointer to the GH comment URL when the run becomes _the_ canonical baseline that future runs compare against (see the existing baseline memory for the shape). One-off comparison runs for a feature branch get nothing in memory at all.

Comment template:

```
**<label>** — branch/SHA, plugins, namespace
- wallclock: Xh Ym (start → end)
- avg events/sec: …
- top 5 by wallclock: handler — Y ms total (Z events, A ms/ea, p95 B ms)
- regressions vs prior baseline: …
```

Style: concise, lowercase by default, matter-of-fact. No `<details><summary>` tags — put the content directly under each bullet.

Keep raw json snapshots in `/tmp/perf-test/` for ad-hoc re-analysis.

## Common pitfalls

- **`pnpm dev` hot-reload mid-run (indexer)** kills the HTTP server and nukes the run. Use `pnpm start`.
- **ENSApi must also run via `pnpm start`, not `pnpm dev`.** When you bring ENSApi up to inspect
  indexed data or to monitor indexing progress (`GET /api/indexing-status`) during a run, `pnpm dev`
  (`tsx watch --env-file ./.env.local`) hot-reloads on _any_ file edit — so editing `.env.local`
  mid-run restarts ENSApi, and if the env changed it can come back pointed at a
  _different_ schema and silently break a schema-gated monitor/kill (e.g. swinging onto a prior
  completed run whose chains are at tip → premature kill). Gotcha: ENSApi's `start`
  (`tsx src/index.ts`) does **not** load `.env.local` (no `--env-file`, no in-code dotenv), so source
  the env and override the schema inline:
  ```bash
  cd apps/ensapi
  set -a; . ./.env.local; set +a
  ENSINDEXER_SCHEMA_NAME=ensindexer_perf_<label> pnpm start > /tmp/perf-test/ensapi.log 2>&1 &
  ```
  Editing files (restoring env) then no longer disturbs the running ENSApi. A brief gap
  while restarting is safe — a status poll that can't reach ENSApi reads 0 and keeps waiting.
- **Untouched `.env.local`** — forgetting to switch `NAMESPACE`/`PLUGINS` → wrong run shape.
  Always `cat .env.local` before launching.
- **Stale prometheus from a prior run** — failing to `pnpm wipe` mixes histograms across
  configs. Wipe between every run.
- **Orphan ponder.js worker after kill** — `pkill -f "ponder --root"` only kills the `pnpm` /
  shell parent; the underlying `node …/ponder.js …` worker keeps running, holds port 42069,
  and silently steals prometheus scrapes from the next indexer (which falls back to 42070 and
  reports `WARN Port in use port=42069` in its log). Between runs, verify with
  `lsof -i :42069` and `pgrep -af ponder.js`. If the worker survived, `kill -9` its PID.
- **`ponder_sync_is_realtime` does not exist** in current Ponder. Older transcripts (and the
  prior version of this skill) used it as the realtime signal — those scripts will hang
  forever today. Use the log-based signal (`Started live indexing chain=` count) instead.
  Available sync metrics in 0.16.x are only `ponder_sync_block` and `ponder_sync_block_timestamp`;
  there is no per-chain realtime flag or per-chain target block to compare against.
- **Indexer-startup race in `LocalPonderClient.metrics`** — `initIndexingOnchainEvents` calls
  `getIndexingMetadataContext` early, which reads chain metrics from the in-process Ponder
  registry. On 6-chain mainnet configs this occasionally races and throws `Local Ponder Client
is missing the Chains Indexing Metrics for indexed chain IDs: 1, 8453, 59144, 10, 42161, 534352`
  → `unhandledRejection` → shutdown. There is no retry. If you see this in the first ~15s,
  drop the schema, wipe prometheus, and relaunch — it is not deterministic and a clean retry
  generally wins the race.
- **EPS dropoff near end of backfill is expected** — as chains finish their backfill ranges,
  the indexer has fewer chains' events to process concurrently, so instantaneous EPS falls.
  3000 → 800 EPS at 99% backfill is normal. Don't interpret it as a stall unless `Indexed
block range` log lines stop appearing for minutes.
- **Metric name drift** — older transcripts use `_seconds_*`. Current Ponder emits ms-scale
  metrics without the `_seconds` suffix. Verify with `curl :42069/metrics | grep duration` if in doubt.
- **Renamed step-8 metrics** — `ponder_postgres_query_total` and `ponder_rpc_request_cache_hits`
  do _not_ exist in current Ponder. Use `ponder_indexing_store_queries_total` and
  `ponder_indexing_rpc_requests_total` / `ponder_indexing_rpc_prefetch_total` instead.
  `curl :42069/metrics | grep -E "^ponder_indexing_(store|rpc)"` is the source of truth.
- **Querying prometheus after indexer stops** without a `time=` parameter returns empty results.
  Always snapshot at `end-epoch`.
- **`ensv2-only` is not v2-only** — the ensv2 plugin pulls in chains 1/8453/10/42161/59144/534352
  to mirror v1 state. Same shape as the canonical multichain configs in terms of chain count.
- **TOCTOU during snapshot** — wait until the wait script signals all chains live before
  snapshotting. Mid-realtime numbers are not stable.
