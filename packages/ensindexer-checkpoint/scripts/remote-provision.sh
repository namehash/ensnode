#!/usr/bin/env bash
# BOX (one-time per fresh box): install the toolchain to run the stack bare. Targets Ubuntu 22.04.
# Idempotent-ish; safe to re-run.
source "$(dirname "$0")/lib.sh"

log "installing system packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  build-essential git curl wget ca-certificates gnupg jq zstd mdadm

# PostgreSQL 17 from PGDG — must match the major version that produced the ponder_sync dump (pg_restore
# is not forward-compatible).
log "installing postgresql 17 (PGDG)"
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
# shellcheck disable=SC1091
. /etc/os-release
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
  | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-17 postgresql-client-17

# Node 24 + pnpm 10.33.0 to match the repo (.nvmrc / packageManager).
log "installing node 24 + pnpm 10.33.0"
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.33.0 --activate

log "installing rclone"
command -v rclone >/dev/null 2>&1 || { curl -fsSL https://rclone.org/install.sh | sudo bash; }

log "stopping the distro-managed postgres cluster (we run our own on the data disk)"
sudo systemctl disable --now postgresql || true

log "provisioning complete."
