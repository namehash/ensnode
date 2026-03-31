# @ensnode/integration-test-env

Integration test environment orchestration for ENSNode. Spins up the full ENSNode stack against the [ens-test-env](https://github.com/ensdomains/contracts-v2) devnet, runs monorepo-level integration tests, then tears everything down.

## Devnet Image

The current devnet image is pinned to:

```
ghcr.io/ensdomains/contracts-v2:main-e8696c6
```

via the `docker-compose.yml` at the monorepo root.

## How It Works

The orchestrator runs a 6-phase pipeline:

1. **Postgres + Devnet** — started in parallel via testcontainers
2. **ENSRainbow database** — downloads pre-built LevelDB, extracts, starts ENSRainbow from source
3. **ENSIndexer** — starts from source, waits for health
4. **Indexing** — polls until omnichain status reaches "Following" or "Completed"
5. **ENSApi** — starts from source, waits for health
6. **Integration tests** — runs `pnpm test:integration`

## Usage

### Automated

```sh
pnpm start
```

Works both in CI and locally — just make sure the required ports are available (8545, 8000, 3223, 42069, 4334).

### Manual (local development)

When developing, it's useful to run each service individually so you can restart or iterate on a single piece without tearing down the whole stack.

#### 1. Start the devnet

```sh
docker compose up devnet
```

Runs the ENS contracts-v2 devnet on port 8545.

#### 2. Start Postgres

You may have Postgres running any which way you want, for example with brew services:

```sh
brew services start postgresql@17
```

or with the local docker compose:

```sh
docker compose up postgres
```

#### 3. Start ENSRainbow

Run via docker compose:

```sh
docker compose up ensrainbow
```

Or run it on the host machine from the repo root:

```sh
cd apps/ensrainbow && pnpm dev
```

with environment variables:

```env
LOG_LEVEL=error
DB_SCHEMA_VERSION=3
LABEL_SET_ID=ens-test-env
LABEL_SET_VERSION=0
```

#### 4. Start ENSIndexer

```sh
cd apps/ensindexer && pnpm dev
```

with environment variables:

```env
DATABASE_SCHEMA=ensindexer_0
NAMESPACE=ens-test-env
PLUGINS=ensv2,protocol-acceleration
```

`DATABASE_SCHEMA` can be any valid Postgres schema name — just make sure ENSApi uses the same value.

#### 5. Start ENSApi

```sh
cd apps/ensapi && pnpm dev
```

with environment variables:

```env
DATABASE_URL=postgresql://ensnode:ensnode@localhost:5432/ensnode
ENSINDEXER_SCHEMA_NAME=ensindexer_0
```

`ENSINDEXER_SCHEMA_NAME` must match the `DATABASE_SCHEMA` used by ENSIndexer above.

#### 6. Run Integration Tests

Finally, you can run vitest on the integration tests using:

```sh
pnpm test:integration
```

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).
