# @ensnode/integration-test-env

Integration test environment orchestration for ENSNode. Spins up the full ENSNode stack against the [ens-test-env](https://github.com/ensdomains/contracts-v2) devnet, runs monorepo-level integration tests, then tears everything down.

## Devnet Image

The current devnet image is pinned to:

```
ghcr.io/ensdomains/contracts-v2:main-e8696c6
```

via the `docker/docker-compose.orchestrator.yml` file.

## How It Works

The lifecycle runs a 6-phase bring-up:

1. **Postgres + Devnet** — started in parallel via testcontainers
2. **Seed devnet** — primary names and resolver records
3. **ENSRainbow database** — downloads pre-built LevelDB, extracts, starts ENSRainbow from source
4. **ENSIndexer** — starts from source, waits for health
5. **Indexing** — polls until omnichain status reaches "Following" or "Completed"
6. **ENSApi** — starts from source, waits for health

Two entrypoints share that bring-up:

- `pnpm start` — bring up the stack and wait for Ctrl+C. Use this when you want to point `pnpm test:integration` (or anything else) at a long-lived stack.
- `pnpm start:ci` — bring up the stack, run `pnpm test:integration` at the monorepo root, then tear everything down (CI flow).

## Usage

### Bring up the stack (manual)

```sh
pnpm start
```

Brings up the full stack and blocks until Ctrl+C. The required ports must be available (8545, 8000, 3223, 42069, 4334). Once it's up, run integration tests from another terminal:

```sh
pnpm test:integration
```

### Full CI pipeline (bring up + tests + tear down)

```sh
pnpm start:ci
```

Works both in CI and locally — just make sure the required ports are available.

### Manual (local development)

When developing, it's useful to run each service individually so you can restart or iterate on a single piece without tearing down the whole stack.

#### 1. Start the devnet

```sh
pnpm devnet
```

Runs the ENS contracts-v2 devnet on port 8545.

#### 2. Start Postgres

You may have Postgres running any which way you want, for example with brew services:

```sh
brew services start postgresql@17
```

or with the local docker compose:

```sh
docker compose -f docker/docker-compose.yml up postgres
```

#### 3. Start ENSRainbow

Run via docker compose:

```sh
docker compose -f docker/docker-compose.yml up ensrainbow
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
NAMESPACE=ens-test-env
PLUGINS=ensv2,protocol-acceleration
```

#### 5. Start ENSApi

```sh
cd apps/ensapi && pnpm dev
```

with environment variables:

```env
ENSDB_URL=postgresql://ensnode:ensnode@localhost:5432/ensnode
ENSINDEXER_SCHEMA_NAME=ensindexer_temp_dev
```

`ENSINDEXER_SCHEMA_NAME` must match the `ENSINDEXER_SCHEMA_NAME` used by ENSIndexer above, and `ensindexer_temp_dev` is the schema name used when running ENSIndexer with `pnpm dev`.

#### 6. Run Integration Tests

Finally, you can run vitest with the integration test suite using:

```sh
pnpm test:integration
```

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).
