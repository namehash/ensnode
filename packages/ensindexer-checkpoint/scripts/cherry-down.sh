#!/usr/bin/env bash
# Terminate the Cherry box (stops hourly billing). The on-box NVMe is ephemeral — the checkpoint was
# already exported to R2. Idempotent; safe to call from an `if: always()` teardown step.
source "$(dirname "$0")/lib.sh"
require curl

API=https://api.cherryservers.com/v1
id="$(box_id)"
if [ -z "$id" ]; then
  warn "no .box-id; nothing to terminate"
  exit 0
fi

log "terminating Cherry server $id"
http="$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $CHERRY_API_TOKEN" -X DELETE "$API/servers/$id" 2>/dev/null || echo 000)"
case "$http" in
  2* | 404)
    # Terminated (or already gone) — safe to discard the local handle.
    rm -f "$LIB_DIR/.box-id" "$LIB_DIR/.box-host"
    log "down (http $http)."
    ;;
  *)
    # KEEP .box-id/.box-host: discarding the only handle to a still-running box would orphan billable
    # hardware. The self-destruct watchdog + GC workflow are backstops, but surface this loudly.
    die "DELETE failed (http $http) for server $id — keeping .box-id/.box-host so it can be retried; terminate manually if it persists"
    ;;
esac
