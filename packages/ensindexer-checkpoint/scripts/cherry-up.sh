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

# CHERRY_REGION may be a space-separated fallback list: bare-metal stock is region-specific and
# transient, so an out-of-stock region rolls over to the next one before giving up.
id=""
for region in $CHERRY_REGION; do
  log "deploying Cherry $CHERRY_PLAN in $region ($CHERRY_IMAGE)"
  body=$(jq -n \
    --arg plan "$CHERRY_PLAN" --arg region "$region" --arg image "$CHERRY_IMAGE" \
    --arg hostname "$BOX_HOSTNAME" --argjson ssh "[$CHERRY_SSH_KEY_ID]" \
    '{plan:$plan, region:$region, image:$image, hostname:$hostname, ssh_keys:$ssh}')
  # Capture the HTTP status alongside the body (no -f) so an auth failure reports as an actionable
  # credential error rather than a bare `curl (22)`.
  resp=$(curl -sS -w $'\n%{http_code}' "${AUTH[@]}" -X POST "$API/projects/$CHERRY_PROJECT_ID/servers" -d "$body") \
    || die "Cherry API request failed (network/curl error)"
  code=${resp##*$'\n'}
  resp=${resp%$'\n'*}
  case "$code" in
    2*) id=$(echo "$resp" | jq -r '.id // empty'); break ;;
    401 | 403) die "Cherry API auth failed (HTTP $code): the CHERRY_API_TOKEN secret is invalid or expired. Generate a fresh token in the Cherry Servers dashboard and update it (\`gh secret set CHERRY_API_TOKEN\`). Response: $resp" ;;
    400) warn "region $region unavailable (HTTP 400): $(echo "$resp" | jq -r '.message // .' 2>/dev/null); trying next region"; continue ;;
    *) die "Cherry deploy failed (HTTP $code) in $region: $resp" ;;
  esac
done
[ -n "$id" ] || die "Cherry deploy failed: no region in '$CHERRY_REGION' had $CHERRY_PLAN in stock"
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
# Fresh box → fresh per-run known_hosts (TOFU pins this box's key on first connect; see lib.sh).
rm -f "$KNOWN_HOSTS_FILE"

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
# The API token is shipped via a 600 file and read at DELETE time — NOT embedded in the SSH command
# argv (which is world-readable in the box's process table).
log "arming self-destruct watchdog (${SELF_DESTRUCT_HOURS}h) on the box"
TOKEN_TMP="$(mktemp)"
printf '%s' "$CHERRY_API_TOKEN" >"$TOKEN_TMP"
scp_to_box "$TOKEN_TMP" ".cherry-token"
rm -f "$TOKEN_TMP"
on_box "chmod 600 ~/.cherry-token && setsid bash -c '
  sleep $(( SELF_DESTRUCT_HOURS * 3600 ))
  curl -fsS -H \"Authorization: Bearer \$(cat ~/.cherry-token)\" -X DELETE https://api.cherryservers.com/v1/servers/$id
  rm -f ~/.cherry-token
' </dev/null >/tmp/self-destruct.log 2>&1 &" || warn "could not arm watchdog (continuing)"

log "box up: ssh -i $SSH_KEY ${BOX_USER:-root}@$ip"
