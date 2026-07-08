# @ensnode/integration-test-env

Orchestrates the full ENSNode stack against the `ens-test-env` devnet so monorepo-level `*.integration.test.ts` files can run against a live instance. `src/lifecycle.ts` is the source of truth; `start.ts` and `ci.ts` are thin entrypoints over it.

## Bring-up contract (lifecycle.ts `bringUp`)

- Strictly ordered phases, each gated on the prior's health: ENSDb+devnet (docker-compose) → seed devnet → ENSRainbow → ENSIndexer → wait for omnichain `Following`/`Completed` → ENSApi. Order matters — seeding MUST land before ENSIndexer starts, since the indexer only sees state present at its start block sweep.
- `--only <a,b>` (comma list of `devnet,ensrainbow,ensindexer,ensapi`) subsets the phases. `devnet` implicitly includes ENSDb + seeding; `ensindexer` implicitly includes the wait-for-indexing poll. Omitted services' ports aren't required.
- On any spawned-service crash, a shared abort flag short-circuits every health/poll loop (`checkAborted`). Services run `detached` and are killed by process-group (`-pid`) on cleanup, because `pnpm` does not forward SIGTERM to its node children — don't "simplify" this to a plain `subprocess.kill()`.

## Two usage modes

- `pnpm start` (blocking) brings up the stack and waits for Ctrl+C; from another terminal run the monorepo-root `pnpm test:integration`. Use for iterating on tests.
- `pnpm start:ci` (`CI=1`) does bring-up → `pnpm test:integration --bail 1` → teardown, all in one process. This is what `test:integration:ci` runs.

## Hardcoded contract (must stay in sync across services)

- Ports: ENSDb **5433** (host), ENSRainbow 3223, ENSIndexer 42069, ENSApi 4334, devnet RPC 8545 (anvil, chain id **31337** — `ensTestEnvChain`). 5433 (not 5432) is deliberate: avoids colliding with manually-started stacks; the orchestrator compose renames containers to `*-orchestrator` for the same reason.
- Schema name `ensindexer_integration_test` is passed identically to ENSIndexer (writer) and ENSApi (reader). They MUST match or ENSApi reads an empty schema.
- ENSIndexer runs `NAMESPACE=ens-test-env`, `PLUGINS=unigraph,protocol-acceleration`. ENSRainbow uses label set `ens-test-env`/`0`, `DB_SCHEMA_VERSION=3`.
- Devnet image is pinned in `docker/docker-compose.orchestrator.yml`; bump it there.

## Devnet seeding (`src/seed/`, fixtures in `src/devnet/fixtures.ts`)

- Accounts derive from the anvil junk mnemonic by index: deployer(0), owner(1), user(2), user2(3) — these are devnet-only addresses, never real.
- Seeds: primary name `test.eth` (on `owner`), the `test.eth` resolver text/addr/abi/contenthash records, and the effective-resolver-fallback case `noresolver.parent.eth` (no own resolver → ENSIP-10 fallback to `parent.eth`). `fixtures.ts` is the single source of truth for expected values; integration tests assert against it, so editing a fixture means re-checking the assertions.

## Gotchas

- Requires a running Docker daemon. ENSRainbow's `/ready` only flips green after it downloads + extracts a prebuilt LevelDB — the slowest phase; budget for it on a cold run.
- Cleanup runs `compose down` with `removeVolumes: true` every time: Ponder rejects a schema owned by a prior app, so the Postgres volume can't be reused across runs. Don't disable this to "speed things up."
- A leftover `*-orchestrator` container or a process squatting a hardcoded port from a crashed prior run will fail bring-up; remove stale containers / free the port first.
- Integration tests read `ENSNODE_URL` (root config defaults to `http://localhost:4334`); the CI flow injects the live ENSApi endpoint. Point it elsewhere to target a remote instance.
