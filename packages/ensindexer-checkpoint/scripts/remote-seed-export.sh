#!/usr/bin/env bash
# BOX: after a full-backfill run has enriched ponder_sync (block/log data current to the live tail),
# dump it and upload as the new canonical R2 seed, then purge older seed objects (keep only the
# canonical one). Run on the ALPHA box only — its ponder_sync spans all chains; the mainnet box's is
# chain-1-only (a subset).
source "$(dirname "$0")/lib.sh"
require psql
require pg_dump
require rclone

OUT="/tmp/${R2_SEED_OBJECT}"
log "ponder_sync size: $(pg -tAc "SELECT pg_size_pretty(sum(pg_total_relation_size(c.oid))) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ponder_sync' AND c.relkind='r'" | tr -d '[:space:]')"
log "pg_dump -Fc -Z3 ponder_sync -> $OUT (compressed; long)"
pg_dump -Fc -Z3 --no-owner --no-privileges -n ponder_sync "$PG_CONN" -f "$OUT"

log "uploading new seed -> $(r2_seed "$R2_SEED_OBJECT")"
rclone copy "$OUT" "$(dirname "$(r2_seed "$R2_SEED_OBJECT")")/"

log "purging any non-canonical seed objects (keep only $R2_SEED_OBJECT)"
while IFS= read -r f; do
  [ "$f" = "$R2_SEED_OBJECT" ] && continue
  [ -n "$f" ] || continue
  log "deleting stray seed/$f"
  rclone deletefile "$(r2_seed "$f")"
done < <(rclone lsf "$(dirname "$(r2_seed x)")/" 2>/dev/null)

rm -f "$OUT"
log "seed export complete."
echo "SEED_EXPORT_DONE_OK"
