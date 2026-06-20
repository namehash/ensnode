#!/usr/bin/env bash
# Deploy a Cherry Servers bare-metal box on hourly billing, wait for it to come up, write its id/ip
# to .box-id/.box-host, and arm an on-box self-destruct watchdog so the box terminates itself even if
# the orchestrating runner dies. Pair with cherry-down.sh.
source "$(dirname "$0")/lib.sh"
require curl
require jq

API=https://api.cherryservers.com/v1
AUTH=(-H "Authorization: Bearer $CHERRY_API_TOKEN" -H "Content-Type: application/json")

: "${CHERRY_API_TOKEN:?}" "${CHERRY_PROJECT_ID:?}" "${CHERRY_PLAN:?}" "${CHERRY_REGION:?}" "${CHERRY_SSH_KEY_ID:?}"

if [ -n "$(box_id)" ]; then
  warn "box already deployed (id $(box_id)); reusing. Run cherry-down.sh first to replace."
  exit 0
fi

log "deploying Cherry $CHERRY_PLAN in $CHERRY_REGION ($CHERRY_IMAGE)"
body=$(jq -n \
  --arg plan "$CHERRY_PLAN" --arg region "$CHERRY_REGION" --arg image "$CHERRY_IMAGE" \
  --arg hostname "$BOX_HOSTNAME" --argjson ssh "[$CHERRY_SSH_KEY_ID]" \
  '{plan:$plan, region:$region, image:$image, hostname:$hostname, ssh_keys:$ssh}')
resp=$(curl -fsS "${AUTH[@]}" -X POST "$API/projects/$CHERRY_PROJECT_ID/servers" -d "$body")
id=$(echo "$resp" | jq -r '.id // empty')
[ -n "$id" ] || die "deploy failed: $resp"
echo "$id" >"$LIB_DIR/.box-id"
log "server id $id provisioning; waiting for active + public IP (bare metal: a few minutes)"

ip=""
state=""
for _ in $(seq 1 120); do
  s=$(curl -fsS "${AUTH[@]}" "$API/servers/$id" 2>/dev/null || true)
  state=$(echo "$s" | jq -r '.state // empty' 2>/dev/null || true)
  ip=$(echo "$s" | jq -r '[.ip_addresses[]? | select(.type=="primary-ip" or .type=="public") | .address] | first // empty' 2>/dev/null || true)
  [ "$state" = "active" ] && [ -n "$ip" ] && break
  sleep 15
done
[ -n "$ip" ] || die "timed out waiting for active+IP (last state=${state:-?})"
echo "$ip" >"$LIB_DIR/.box-host"

log "server active at $ip; waiting for SSH"
up=0
for _ in $(seq 1 30); do
  if on_box true >/dev/null 2>&1; then
    up=1
    break
  fi
  sleep 10
done
[ "$up" = "1" ] || die "timed out waiting for SSH to $ip"

# Arm the self-destruct watchdog: a detached process on the box that, after SELF_DESTRUCT_HOURS,
# DELETEs this server via the Cherry API. Survives runner death; cherry-down.sh is the normal path.
log "arming self-destruct watchdog (${SELF_DESTRUCT_HOURS}h) on the box"
on_box "CHERRY_API_TOKEN='$CHERRY_API_TOKEN' setsid bash -c '
  sleep $(( SELF_DESTRUCT_HOURS * 3600 ))
  curl -fsS -H \"Authorization: Bearer \$CHERRY_API_TOKEN\" -X DELETE https://api.cherryservers.com/v1/servers/$id
' </dev/null >/tmp/self-destruct.log 2>&1 &" || warn "could not arm watchdog (continuing)"

log "box up: ssh -i $SSH_KEY ${BOX_USER:-root}@$ip"
