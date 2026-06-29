#!/usr/bin/env bash
# Configuration for the ENSIndexer checkpoint pipeline.
#
# Every value is read from the environment. In CI (GitHub Actions) these come from secrets/inputs;
# for a local/manual run, copy this file to `config.sh` (gitignored) and fill it in. lib.sh sources
# `config.sh` if present, otherwise relies on the ambient environment — so DO NOT hardcode secrets
# here. NEVER commit real tokens.

# ── Cherry Servers (the disposable build box) ────────────────────────────────
export CHERRY_API_TOKEN="${CHERRY_API_TOKEN:-}"     # Cherry API token (secret)
export CHERRY_PROJECT_ID="${CHERRY_PROJECT_ID:-}"   # numeric project id (secret)
# Plan/region are hardcoded (not secrets) — the bare-metal SKU + a space-separated region fallback
# list (cherry-up.sh tries each until one has stock). amd-ryzen-9950x stock is region-specific and
# transient; check live availability at https://api.cherryservers.com/v1/plans/amd-ryzen-9950x.
export CHERRY_PLAN="${CHERRY_PLAN:-amd-ryzen-9950x}"
export CHERRY_REGION="${CHERRY_REGION:-US-Chicago SE-Stockholm LT-Siauliai DE-Frankfurt NL-Amsterdam JP-Tokyo}"
export CHERRY_IMAGE="${CHERRY_IMAGE:-ubuntu_22_04}" # OS image slug
export CHERRY_SSH_KEY_ID="${CHERRY_SSH_KEY_ID:-}"   # numeric id of the SSH key registered with Cherry
export SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"  # matching private key for ssh/scp to the box
export BOX_USER="${BOX_USER:-root}"
export BOX_HOSTNAME="${BOX_HOSTNAME:-ensindexer-checkpoint}"  # used as the Cherry hostname + reaper tag
# postgres refuses to run as root; on a root box run the cluster as the `postgres` OS user.
export PG_RUN_USER="${PG_RUN_USER:-postgres}"
# Safety net: the box terminates ITSELF this many hours after provisioning, even if the orchestrating
# runner dies and never tears it down. Keep comfortably above a full index (~6h) for headroom.
export SELF_DESTRUCT_HOURS="${SELF_DESTRUCT_HOURS:-20}"

# Bare-metal data device(s): the NVMe NOT holding the OS (inspect `lsblk`). Empty = use a directory
# on the existing filesystem.
export DATA_DEVICES="${DATA_DEVICES:-}"             # e.g. "/dev/nvme1n1"
export DATA_MOUNT="${DATA_MOUNT:-/mnt/ensdb}"
export PGDATA="${PGDATA:-/mnt/ensdb/pgdata}"
export ENSRAINBOW_DATA_DIR="${ENSRAINBOW_DATA_DIR:-/mnt/ensdb/ensrainbow}"

# ── R2 (durable seed + checkpoints + locks) ──────────────────────────────────
# The box uses an rclone remote named "$RCLONE_REMOTE", generated from these R2 credentials by lib.sh's
# write_rclone_conf. The access key/secret come from secrets (CF_R2_ACCESS_KEY_ID / CF_R2_SECRET_ACCESS_KEY,
# mapped into R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY by the workflow). The endpoint is the account-level
# S3 URL (NOT including the bucket); the account id in it is not sensitive, so it's hardcoded here.
export RCLONE_REMOTE="${RCLONE_REMOTE:-r2}"
export R2_CHECKPOINTS_BUCKET="${R2_CHECKPOINTS_BUCKET:-ensindexer-checkpoints}"
export R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}"
export R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}"
export R2_ENDPOINT="${R2_ENDPOINT:-https://568d25449daec794a4cf277e3c286406.r2.cloudflarestorage.com}"
export R2_SEED_PREFIX="${R2_SEED_PREFIX:-seed}"
export R2_CHECKPOINT_PREFIX="${R2_CHECKPOINT_PREFIX:-checkpoints}"
export R2_LOCK_PREFIX="${R2_LOCK_PREFIX:-locks}"
export R2_SEED_OBJECT="${R2_SEED_OBJECT:-ponder_sync.dump}"  # canonical seed object name

# ── postgres / ensdb (on the box; trust auth on localhost) ───────────────────
export PG_CONN="${PG_CONN:-postgresql://postgres@localhost:5432/ponder}"
export ENSDB_URL="${ENSDB_URL:-postgresql://postgres@localhost:5432/ponder}"

# ── ENSIndexer runtime ───────────────────────────────────────────────────────
export ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-}"       # startup chain-id/finalized-block checks (low volume)
export ENSRAINBOW_PORT="${ENSRAINBOW_PORT:-3223}"
export ENSAPI_PORT="${ENSAPI_PORT:-4334}"
export REPO_URL="${REPO_URL:-https://github.com/namehash/ensnode.git}"
export REPO_DIR="${REPO_DIR:-$HOME/ensnode}"
