#!/usr/bin/env bash
# Shared helpers. Source at the top of every script: source "$(dirname "$0")/lib.sh"
set -euo pipefail

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source a local config.sh if present (manual runs); otherwise rely on the ambient environment (CI).
if [ -f "$LIB_DIR/config.sh" ]; then
  # shellcheck disable=SC1091
  source "$LIB_DIR/config.sh"
else
  # shellcheck disable=SC1091
  source "$LIB_DIR/config.example.sh"
fi

log() { printf '\033[36m[%s]\033[0m %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
warn() { printf '\033[33m[%s] WARN:\033[0m %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die() {
  printf '\033[31m[%s] ERROR:\033[0m %s\n' "$(date +%H:%M:%S)" "$*" >&2
  exit 1
}
require() { command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"; }

# ── box connection (Cherry, plain ssh/scp) ───────────────────────────────────
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10)

box_host() { [ -f "$LIB_DIR/.box-host" ] && cat "$LIB_DIR/.box-host" || echo ""; }
box_id() { [ -f "$LIB_DIR/.box-id" ] && cat "$LIB_DIR/.box-id" || echo ""; }

# run a command on the box
on_box() {
  ssh "${SSH_OPTS[@]}" -i "$SSH_KEY" "${BOX_USER:-root}@$(box_host)" "$@"
}

# copy local path(s) to the box; last arg is the remote destination dir/path
scp_to_box() {
  local dest="${*: -1}"
  local srcs=("${@:1:$#-1}")
  scp "${SSH_OPTS[@]}" -i "$SSH_KEY" -r "${srcs[@]}" "${BOX_USER:-root}@$(box_host):$dest"
}

# ── R2 paths (rclone) ────────────────────────────────────────────────────────
r2_seed() { echo "${RCLONE_REMOTE}:${R2_CHECKPOINTS_BUCKET}/${R2_SEED_PREFIX}/$1"; }
r2_checkpoint() { echo "${RCLONE_REMOTE}:${R2_CHECKPOINTS_BUCKET}/${R2_CHECKPOINT_PREFIX}/$1"; }
r2_lock() { echo "${RCLONE_REMOTE}:${R2_CHECKPOINTS_BUCKET}/${R2_LOCK_PREFIX}/$1"; }

# Write an rclone.conf for the "$RCLONE_REMOTE" S3-compatible R2 remote from R2_* credentials.
write_rclone_conf() {
  local dest="${1:?dest path}"
  mkdir -p "$(dirname "$dest")"
  cat >"$dest" <<EOF
[${RCLONE_REMOTE}]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = ${R2_ENDPOINT}
no_check_bucket = true
EOF
}

# checkpoint object name for a (config, sha) pair; optional suffix (e.g. -t<timestamp>) for dev checkpoints.
checkpoint_object() { echo "${1}-${2}${3:-}.dump"; }

# True if an object exists in R2.
r2_exists() { rclone lsf "$1" >/dev/null 2>&1 && [ -n "$(rclone lsf "$1" 2>/dev/null)" ]; }

# ── R2 lock (defense-in-depth; the GH Actions concurrency group is the hard guarantee) ───────────
LOCK_TTL_SECONDS="${LOCK_TTL_SECONDS:-43200}" # 12h: a stale lock older than this is broken
acquire_lock() {
  local key="$1" p now held
  p="$(r2_lock "$key")"
  now="$(date +%s)"
  if r2_exists "$p"; then
    held="$(rclone cat "$p" 2>/dev/null | head -1 | tr -d '[:space:]')"
    if [[ "$held" =~ ^[0-9]+$ ]] && [ $((now - held)) -lt "$LOCK_TTL_SECONDS" ]; then
      die "R2 lock held for '$key' (age $((now - held))s < TTL). Another checkpoint run in progress?"
    fi
    warn "breaking stale R2 lock for '$key'"
  fi
  printf '%s\n' "$now" | rclone rcat "$p"
  log "acquired R2 lock '$key'"
}
release_lock() { rclone deletefile "$(r2_lock "$1")" 2>/dev/null || true; }

# ── postgres lifecycle (BOX only) — self-managed cluster at $PGDATA ───────────
PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
pg_ctl_bin() { echo "${PG_BIN:+$PG_BIN/}pg_ctl"; }
PG_RUN_USER="${PG_RUN_USER:-$(id -un)}"
pg_as() { if [ "$PG_RUN_USER" = "$(id -un)" ]; then "$@"; else sudo -u "$PG_RUN_USER" "$@"; fi; }

# Write-heavy tuning for the disposable box: maximize bulk-load throughput. synchronous_commit=off is
# safe here because the box is throwaway — a crash means we re-run from the R2 seed, not data loss in
# a system of record.
pg_tuned_opts() {
  local mem_kb total_mb shared_mb cache_mb
  mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 16777216)"
  total_mb=$((mem_kb / 1024))
  shared_mb=$((total_mb / 4))
  cache_mb=$((total_mb * 7 / 10))
  printf -- '-c listen_addresses=localhost -p 5432 -c unix_socket_directories=/tmp'
  printf -- ' -c shared_buffers=%sMB -c effective_cache_size=%sMB' "$shared_mb" "$cache_mb"
  printf -- ' -c maintenance_work_mem=2GB -c max_wal_size=48GB -c min_wal_size=2GB'
  printf -- ' -c checkpoint_timeout=30min -c checkpoint_completion_target=0.9'
  printf -- ' -c synchronous_commit=off -c wal_compression=off'
  printf -- ' -c autovacuum_vacuum_scale_factor=0.4 -c max_parallel_maintenance_workers=4'
}

pg_start() {
  [ -d "$PGDATA" ] || die "PGDATA $PGDATA missing (run remote-rehydrate.sh first)"
  if pg_as "$(pg_ctl_bin)" -D "$PGDATA" status >/dev/null 2>&1; then
    log "postgres already running"
    return
  fi
  log "starting postgres on $PGDATA (as $PG_RUN_USER, write-heavy tuning)"
  pg_as "$(pg_ctl_bin)" -D "$PGDATA" -l "$PGDATA/server.log" -o "$(pg_tuned_opts)" -w start
}

pg_stop() { pg_as "$(pg_ctl_bin)" -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true; }

# run psql against the box cluster, fail-fast
pg() { psql "$PG_CONN" -v ON_ERROR_STOP=1 "$@"; }
