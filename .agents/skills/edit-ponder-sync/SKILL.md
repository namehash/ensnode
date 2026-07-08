---
name: edit-ponder-sync
description: >
  Inspect and surgically edit Ponder's RPC sync cache (the `ponder_sync` Postgres schema):
  understand what's cached, diagnose stale/contaminated cache (e.g. a restarted ens-test-env
  devnet reusing chain id 31337), and clip/purge a block range so Ponder re-fetches it cleanly
  without re-syncing the whole chain. Use when a handler throws RecordNotFoundError on an entity
  that should exist, when cached block hashes diverge from the live chain, or when splicing one
  chain's sync data into another (upstream chain → a fork of it).
---

# Editing Ponder Sync (`ponder_sync`)

`ponder_sync` is Ponder's **RPC cache** — blocks, logs, transactions, receipts, traces, and the
per-filter "what ranges have I synced" bookkeeping. It is separate from the **entity** schema
(`ENSINDEXER_SCHEMA_NAME`, e.g. `ensindexer_temp_dev`) which holds the indexed app data (`domains`,
`registries`, …) plus Ponder's `_ponder_checkpoint` / `_ponder_meta`.

Editing `ponder_sync` is the right tool when the cache is **wrong or contaminated** and you want
Ponder to re-fetch a range from the RPC. It is reversible (anything deleted is re-fetchable), but
you must keep the `intervals` table consistent with the row tables or Ponder will trust a hole.

Local Postgres in this repo: `postgresql://postgres@localhost:5432/ponder`. Always scope edits by `chain_id`.

## Schema cheat-sheet

```
ponder_sync.blocks                -- one row per CACHED block. KEY COLUMN: number (NOT block_number).
                                  --   columns: number, hash, parent_hash, timestamp, chain_id, …
ponder_sync.logs                  -- block_number, log_index, address, topic0..3, block_hash, data, …
ponder_sync.transactions          -- block_number, hash, from, to, …
ponder_sync.transaction_receipts  -- block_number, transaction_hash, status, …  (often empty: Ponder
                                  --   only fetches receipts when a handler/config needs them)
ponder_sync.traces                -- block_number, trace_index, …                (often empty)
ponder_sync.rpc_request_results   -- block_number (nullable), request_hash, result -- cached eth_call etc.
ponder_sync.intervals             -- THE SOURCE OF TRUTH for "synced". fragment_id (PK), chain_id,
                                  --   blocks (nummultirange).
ponder_sync.factories /           -- factory-pattern (CREATE2 child) address discovery. Children
ponder_sync.factory_addresses     --   discovered above a fork are valid current-chain data.
```

Gotchas that will bite you:

- **`address`, `hash`, `topic*` are stored as TEXT** (`0x…` lowercase strings), **not bytea**.
  `WHERE address = '\x0000…'` silently matches nothing and returns count 0. Use
  `WHERE address = '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e'`.
- **`blocks` is sparse.** Ponder only caches blocks that contain a matching log (plus interval
  boundaries / finalized blocks). Most heights have no row — a missing block in `blocks` is normal,
  not a gap. Don't infer sync coverage from `blocks`; infer it from `intervals`.
- **`blocks` uses `number`; every other table uses `block_number`.**
- A row existing in `logs`/`blocks` does **not** mean Ponder will use it. Ponder decides what to
  fetch/replay from `intervals`. If an interval says a range is synced, Ponder trusts the cache and
  will **not** re-fetch — even if the cached blocks are stale.

## How `intervals` works

One row per **filter fragment** — a specific (chain, address, topic0, …) combination Ponder syncs.
`fragment_id` looks like:

```
log_<chainId>_<address|null>_<topic0|null>_<topic1>_<topic2>_<topic3>_<n>
```

`blocks` is a Postgres `nummultirange` of the synced ranges, e.g.
`{[3702728,10770756],[10887910,10888672]}`. A **gap** between segments = unsynced → Ponder
re-fetches it. A continuous range = fully trusted cache.

**Bounds must be inclusive `[a,b]`.** `nummultirange` is over `numeric`, which (unlike
`int8range`) does **not** canonicalize `[)` → `[]`. If you intersect with a default-bound range you
get a half-open `[a,b)` that Ponder mis-reads. Always force the inclusive upper bound:

```sql
-- WRONG: leaves an exclusive upper bound [3702728,10770757)
blocks * nummultirange(numrange(NULL, 10770757))
-- RIGHT: yields inclusive [3702728,10770756]
blocks * nummultirange(numrange(NULL, 10770756, '(]'))
```

Sanity check after any interval edit — this must return 0:

```sql
SELECT count(*) FROM ponder_sync.intervals
WHERE chain_id = <chain> AND blocks::text LIKE '%)%';
```

## Recipe: purge a chain wholesale (devnet restart)

The ens-test-env devnet (anvil, chain id `31337`) is a fresh chain on every restart — but the chain
id stays the same, so `ponder_sync` keeps trusting cache from the previous run and Ponder serves
stale blocks instead of re-fetching. There is no clean prefix worth keeping (the chain is tiny and
free to re-sync), so purge everything for the chain:

```sql
BEGIN;
DELETE FROM ponder_sync.intervals            WHERE chain_id = 31337;
DELETE FROM ponder_sync.logs                 WHERE chain_id = 31337;
DELETE FROM ponder_sync.transaction_receipts WHERE chain_id = 31337;
DELETE FROM ponder_sync.transactions         WHERE chain_id = 31337;
DELETE FROM ponder_sync.traces               WHERE chain_id = 31337;
DELETE FROM ponder_sync.rpc_request_results  WHERE chain_id = 31337;
DELETE FROM ponder_sync.blocks               WHERE chain_id = 31337;
COMMIT;
```

(Deterministic deploys may reproduce identical early blocks across runs — don't rely on it.)

## Recipe: clip the cache to block N and re-fetch the tail

Use when cache above some block N is stale/contaminated and you want Ponder to re-fetch `(N, head]`
from the RPC while keeping the (expensive) deep history below N. Pick N = the **last block whose
cached hash matches the live chain** (see diagnosis below).

```sql
BEGIN;
-- 1. clip every synced interval to [.., N] inclusive
UPDATE ponder_sync.intervals
SET blocks = blocks * nummultirange(numrange(NULL, <N>, '(]'))
WHERE chain_id = <chain>;

-- 2. delete cached rows above N so they re-fetch clean (note: blocks uses `number`)
DELETE FROM ponder_sync.logs                 WHERE chain_id=<chain> AND block_number > <N>;
DELETE FROM ponder_sync.transaction_receipts WHERE chain_id=<chain> AND block_number > <N>;
DELETE FROM ponder_sync.transactions         WHERE chain_id=<chain> AND block_number > <N>;
DELETE FROM ponder_sync.traces               WHERE chain_id=<chain> AND block_number > <N>;
DELETE FROM ponder_sync.rpc_request_results  WHERE chain_id=<chain> AND block_number > <N>;
DELETE FROM ponder_sync.blocks               WHERE chain_id=<chain> AND number       > <N>;
COMMIT;
```

Then restart the indexer. If the chain has **no** `_ponder_checkpoint` row and no entity rows, Ponder
indexes it from scratch over the (now-correct) cache + re-fetched tail. If it has a checkpoint, it
resumes from there.

Always do interval clip + row deletes in **one transaction**, and keep them consistent: an interval
that claims a range is synced while the rows are gone makes Ponder skip real events; rows present
under a clipped interval are harmless (they get overwritten on re-fetch).

## Diagnosing a stale / contaminated cache

Symptom: a handler throws `RecordNotFoundError: No existing record found in table 'domains'` on a
`db.update` (e.g. `ENSv1Registry:Transfer`) for an entity whose creating event (`NewOwner`) is
earlier on-chain. The creating event was never indexed because the cache around it is stale.

The usual culprit in this repo is a **restarted ens-test-env devnet** (chain id `31337`): the new
run is a different chain under the same chain id, so every cached block from the old run diverges —
purge the chain wholesale (recipe above). The same pattern appears with re-created forked testnets:
re-forking gives the chain a **new fork block**, so cached blocks from the old incarnation diverge
from the live chain, and clearing the cache only _above_ your resume point leaves the old-fork
window _below_ it intact. The diagnosis below finds the clip point for that partial-divergence case.

Steps:

1. **Identify the failing node and its creating tx.** From the error, get `node`, `tx hash`,
   `block`. Pull the receipt via the chain's RPC (`RPC_URL_<chainId>` in `apps/ensindexer/.env.local`)
   to see the real event ordering (`NewOwner` creates, `Transfer`/`NewResolver` mutate).
2. **Compare cached block hashes to the live chain** at the failing block and the creating block:

   ```sql
   SELECT number, hash FROM ponder_sync.blocks WHERE chain_id=<chain> AND number IN (<create>,<fail>);
   ```

   vs `eth_getBlockByNumber` on the live RPC. A mismatch at the creating block but a match at the
   failing block = the cache below your resume point is from a different fork.

3. **Find the true fork block** (last block where live testnet == real upstream chain) by binary
   search over `eth_getBlockByNumber` hashes (testnet RPC vs a real upstream RPC, e.g. a public
   node for the upstream chain). Test activity lives strictly **above** this block. (For the
   ens-test-env devnet there is no upstream — skip the search and purge the chain wholesale.)
4. **Find where the cache goes stale** (last cached block whose hash matches the real upstream
   chain). Sample cached block numbers ascending and compare hashes; binary-search the boundary.
   That boundary is the **old** fork — your clip point N.
5. Clip + purge with the recipe above, using N = last clean block.

Helper to compare a live RPC hash to the cache:

```bash
RPC=$(grep RPC_URL_<chainId> apps/ensindexer/.env.local | cut -d= -f2-)
rpchash(){ curl -s -X POST "$1" -H 'content-type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getBlockByNumber\",\"params\":[\"$(printf 0x%x $2)\",false]}" \
  | grep -o '"hash":"0x[0-9a-f]*"' | head -1 | sed 's/"hash":"//;s/"//'; }
cachehash(){ psql "postgresql://postgres@localhost:5432/ponder" -tA \
  -c "select hash from ponder_sync.blocks where chain_id=<chainId> and number=$1;"; }
```

## Splicing one chain's sync into a forked chain

A forked testnet _is_ the upstream chain below its fork block, so you can avoid re-syncing millions
of blocks through the fork's (often rate-limited) RPC by reusing real-upstream sync data:

- For blocks `≤ forkBlock`: forked testnet ≡ upstream chain. Cache built against the upstream chain
  (with `chain_id` rewritten to the testnet's id) is valid.
- For blocks `> forkBlock`: only the testnet has the data; must come from the testnet RPC.

The clip-and-refetch recipe handles the common case: keep valid cache below the (true, current)
fork, let Ponder fetch the small tail above it from the fork's RPC. Only hand-splice upstream rows if even
that tail is too large for the testnet RPC. When splicing, rewrite `chain_id` on every table **and**
`intervals`, and keep `intervals` bounds inclusive.

## Don't

- Don't propose a Drizzle/Ponder schema migration — `ponder_sync` is Ponder-owned; edit it directly
  in SQL, never via app migrations.
- Don't delete rows without clipping the matching `intervals` (Ponder will trust the now-empty range
  and skip events).
- Don't trust the `blocks` table for coverage (it's sparse); trust `intervals`.
- Don't use `\x…` bytea literals against the TEXT `address`/`hash`/`topic*` columns.
