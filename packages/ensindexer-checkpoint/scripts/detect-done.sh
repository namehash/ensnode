#!/usr/bin/env bash
# BOX: report Ponder readiness for a schema. Arg $1 = schema name.
# Prints: is_ready=<0|1> chain1_block=<n>
#
# Authoritative completion signal: `<schema>._ponder_meta` app.is_ready flips 0->1 when historical
# backfill completes. (omnichainStatus is unreliable for multi-datasource configs — do not trust it.)
SCH="$1"
PGURL="${PG_CONN:-postgresql://postgres@localhost:5432/ponder}"
ready=$(psql "$PGURL" -tAc "SELECT (value->>'is_ready') FROM \"$SCH\".\"_ponder_meta\" WHERE key='app'" 2>/dev/null | tr -d '[:space:]')
c1=$(psql "$PGURL" -tAc "SELECT ltrim(substr(latest_checkpoint::text,27,16),'0') FROM \"$SCH\".\"_ponder_checkpoint\" WHERE chain_id=1" 2>/dev/null | tr -d '[:space:]')
echo "is_ready=${ready:-?} chain1_block=${c1:-?}"
