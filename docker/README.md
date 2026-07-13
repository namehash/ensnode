# Docker Compose

All commands are run from the **monorepo root**.

## Files

| File                                     | Purpose                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `docker/docker-compose.yml`              | Base stack — ensindexer, ensapi, ensrainbow, ensadmin, ensdb. For mainnet/sepolia.     |
| `docker/docker-compose.devnet.yml`       | Full stack against local devnet (`ens-test-env`). Includes all base services + devnet. |
| `docker/docker-compose.orchestrator.yml` | Minimal infra for CI — devnet + ensdb only. Used by `orchestrator.ts`.                 |
| `docker/services/*.yml`                  | Individual service definitions. Extended by the compose files above.                   |
| `docker/envs/.env.docker.common`         | Shared env defaults (ensdb credentials, internal service URLs). Committed.             |
| `docker/envs/.env.docker.devnet`         | Devnet defaults (PLUGINS, etc.). Committed. Works out of the box.                      |
| `docker/envs/.env.docker.example`        | Example for user-specific config. Copy to `.env.docker.local` for mainnet/sepolia.     |
| `docker/envs/.env.docker.local`          | User config (gitignored). Required for base stack, optional for devnet overrides.      |

> To inspect the fully resolved config for any compose file (resolves all `extends`):
>
> ```
> docker compose -f docker/docker-compose.yml config
> ```

## Build-time environment

The ENSNode service images (`ensindexer`, `ensapi`, `ensrainbow`) bake a `GIT_COMMIT` value into their public config's `versionInfo.commit`. When building these docker images, you can pass the `GIT_COMMIT` build arg in order to "bake in" the commit reference into each docker image.

### Docker compose

```bash
GIT_COMMIT=$(git rev-parse HEAD) docker compose -f docker/docker-compose.yml up --build
```

### Docker build

```bash
docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -f apps/ensapi/Dockerfile -t ghcr.io/namehash/ensnode/ensapi:latest .
docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -f apps/ensindexer/Dockerfile -t ghcr.io/namehash/ensnode/ensindexer:latest .
docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -f apps/ensrainbow/Dockerfile -t ghcr.io/namehash/ensnode/ensrainbow:latest .
```

## Use cases

### Mainnet / Sepolia

**1. Configure environment** (one-time setup):

```bash
cp docker/envs/.env.docker.example docker/envs/.env.docker.local
```

Edit `docker/envs/.env.docker.local` and set `NAMESPACE`, `PLUGINS`, and your RPC endpoints (e.g. `ALCHEMY_API_KEY` or `RPC_URL_1`).

**2. Start/stop the stack:**

```bash
# Start full stack in background
docker compose -f docker/docker-compose.yml up -d

# Stop
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes
docker compose -f docker/docker-compose.yml down -v
```

### Local devnet (for developers)

No setup required — devnet defaults are committed in `docker/envs/.env.docker.devnet`.

To override defaults (e.g. change `PLUGINS`), create `docker/envs/.env.docker.local` with your values.

```bash
# Start full stack against devnet
docker compose -f docker/docker-compose.devnet.yml up -d

# Start only devnet + core services (no ensadmin)
docker compose -f docker/docker-compose.devnet.yml up -d ensindexer ensapi

# Start only devnet (quick local EVM node, also shows data information about devnet)
docker compose -f docker/docker-compose.devnet.yml up devnet
# or
pnpm devnet

# Stop
docker compose -f docker/docker-compose.devnet.yml down
```

### Build images locally

```bash
# Build all images
pnpm docker:build:ensnode

# Build a specific image
pnpm docker:build:ensindexer
pnpm docker:build:ensapi
pnpm docker:build:ensrainbow
pnpm docker:build:ensadmin
```

### CI / integration tests

Used internally by `orchestrator.ts` via testcontainers. Starts devnet + ensdb only.

```bash
pnpm test:integration:ci
```
