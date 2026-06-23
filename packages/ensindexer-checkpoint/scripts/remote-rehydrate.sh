#!/usr/bin/env bash
# BOX: prepare ephemeral storage — mount the data NVMe, init a write-tuned postgres cluster on it, and
# restore ponder_sync from the canonical R2 seed. Idempotent within a box's lifetime (skips work
# already done). Local NVMe can't be snapshotted, so this runs on each fresh box.
source "$(dirname "$0")/lib.sh"
require rclone
require psql
require pg_restore

# ── data storage: dedicated NVMe (mount, RAID0 if multiple) OR a dir on the existing fs ──────────
if ! mountpoint -q "$DATA_MOUNT" && [ ! -d "$PGDATA" ]; then
  SSDS=()
  if [ -n "${DATA_DEVICES:-}" ]; then read -ra SSDS <<<"$DATA_DEVICES"; fi
  if [ "${#SSDS[@]}" -ge 1 ]; then
    log "using ${#SSDS[@]} data device(s): ${SSDS[*]}"
    if [ "${#SSDS[@]}" -ge 2 ]; then
      [ -b /dev/md0 ] || sudo mdadm --create /dev/md0 --level=0 --raid-devices="${#SSDS[@]}" "${SSDS[@]}"
      DEV=/dev/md0
    else
      DEV="${SSDS[0]}"
    fi
    sudo blkid "$DEV" >/dev/null 2>&1 || sudo mkfs.ext4 -F -m 0 "$DEV"
    sudo mkdir -p "$DATA_MOUNT" && sudo mount "$DEV" "$DATA_MOUNT"
  else
    log "no dedicated data device; using $DATA_MOUNT on the existing filesystem"
    sudo mkdir -p "$DATA_MOUNT"
  fi
  sudo chown -R "$PG_RUN_USER:$PG_RUN_USER" "$DATA_MOUNT"
fi

# ── postgres cluster ─────────────────────────────────────────────────────────
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  log "initdb at $PGDATA (as $PG_RUN_USER)"
  pg_as mkdir -p "$PGDATA"
  pg_as "${PG_BIN:+$PG_BIN/}initdb" -U postgres -D "$PGDATA" --auth-local=trust --auth-host=trust
fi
pg_start
psql "postgresql://postgres@localhost:5432/postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='ponder'" \
  | grep -q 1 || psql "postgresql://postgres@localhost:5432/postgres" -c "CREATE DATABASE ponder;"

# ── restore ponder_sync from R2 (if a seed exists) ───────────────────────────
if pg -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name='ponder_sync'" | grep -q 1; then
  warn "ponder_sync already present; skipping restore"
elif r2_exists "$(r2_seed "$R2_SEED_OBJECT")"; then
  log "downloading + restoring ponder_sync from R2 (large; be patient)"
  rclone copy --progress "$(r2_seed "$R2_SEED_OBJECT")" "$DATA_MOUNT/"
  pg_restore --no-owner --no-privileges -j 4 -d "$PG_CONN" "$DATA_MOUNT/$R2_SEED_OBJECT"
  rm -f "$DATA_MOUNT/$R2_SEED_OBJECT"
else
  die "no R2 seed at $(r2_seed "$R2_SEED_OBJECT") — a seed is a hard requirement. Bootstrap it first (copy or produce seed/$R2_SEED_OBJECT in the checkpoints bucket)."
fi

log "rehydrate complete: postgres up on $PGDATA with ponder_sync restored."
