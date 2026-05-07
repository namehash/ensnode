#!/usr/bin/env bash
# Clear all series from the local Prometheus instance. Requires prometheus to be
# running with --web.enable-admin-api (set in docker-compose.yml).
set -euo pipefail

PROM_URL="${PROM_URL:-http://localhost:9090}"

curl --fail --show-error -X POST \
  "${PROM_URL}/api/v1/admin/tsdb/delete_series?match%5B%5D=%7B__name__%3D~%22.%2B%22%7D"

curl --fail --show-error -X POST \
  "${PROM_URL}/api/v1/admin/tsdb/clean_tombstones"
