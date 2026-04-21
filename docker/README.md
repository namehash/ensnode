# Docker Compose

All commands are run from the **monorepo root**.

## Files

| File | Purpose |
|------|---------|
| `docker/docker-compose.yml` | Base stack — ensindexer, ensapi, ensrainbow, ensadmin, postgres. Targets mainnet with default .env.local |
| `docker/docker-compose.devnet.yml` | Full stack against local devnet (`ens-test-env`). Includes all base services + devnet. |
| `docker/docker-compose.orchestrator.yml` | Minimal infra for CI — devnet + postgres only. Used by `orchestrator.ts`. |
| `docker/services/*.yml` | Individual service definitions. Extended by the compose files above. |
| `docker/.env.docker-compose` | Shared env defaults (postgres credentials, internal service URLs). Usually is placed after .env.local so wil override it by design |

> To inspect the fully resolved config for any compose file (resolves all `extends`):
> ```bash
> docker compose -f docker/docker-compose.yml config
> ```

## Use cases

### Mainnet

**1. Configure environment files** (one-time setup):

```bash
cp apps/ensindexer/.env.local.example apps/ensindexer/.env.local
cp apps/ensapi/.env.local.example apps/ensapi/.env.local
cp apps/ensrainbow/.env.local.example apps/ensrainbow/.env.local
```

Edit both files and set your RPC endpoints (e.g. `RPC_URL_1`, `ALCHEMY_API_KEY`) and any other required values.

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

All config is inlined — no `.env.local` files required.

```bash
# Start full stack against devnet
docker compose -f docker/docker-compose.devnet.yml up -d

# Start only devnet + core services (no ensadmin)
docker compose -f docker/docker-compose.devnet.yml up -d devnet postgres ensrainbow ensindexer ensapi

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

Used internally by `orchestrator.ts` via testcontainers. Starts devnet + postgres only.

```bash
pnpm test:integration:ci
```
