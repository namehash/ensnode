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
curl -fsS -H "Authorization: Bearer $CHERRY_API_TOKEN" -X DELETE "$API/servers/$id" >/dev/null \
  || warn "DELETE returned non-200 (already gone?)"
rm -f "$LIB_DIR/.box-id" "$LIB_DIR/.box-host"
log "down."
