# @ensnode/integration-test-env

Integration test environment orchestration for ENSNode. Spins up the full ENSNode stack against the [ens-test-env](https://github.com/ensdomains/contracts-v2) devnet, runs monorepo-level integration tests, then tears everything down.

## Devnet Image

The current devnet image is pinned to:


```
ghcr.io/ensdomains/contracts-v2:main-cb8e11c
```

Update the `DEVNET_IMAGE` constant in the orchestrator source to change the devnet version.

## How It Works

The orchestrator runs a 6-phase pipeline:

1. **Postgres + Devnet** — started in parallel via testcontainers
2. **ENSRainbow database** — downloads pre-built LevelDB, extracts, starts ENSRainbow from source
3. **ENSIndexer** — starts from source, waits for health
4. **Indexing** — polls until omnichain status reaches "Following" or "Completed"
5. **ENSApi** — starts from source, waits for health
6. **Integration tests** — runs `pnpm test:integration` at monorepo root

## Usage

```sh
pnpm start
```

Works both in CI and locally — just make sure the required ports are available (8545, 8000, 3223, 42069, 4334).

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).
