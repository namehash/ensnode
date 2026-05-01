# Task 0006: `@ensnode/ens-test-kit` — Implementation Steps

See [IDEA.md](./IDEA.md) for the design rationale.

**Steps, not PRs.** This document is broken into implementation *steps*. How these steps map to pull requests is **the user's decision** — some steps may ship as a single PR, others may be combined, and a single step may be split across multiple PRs if it grows. The user will announce the PR boundary (e.g. "ship a PR now after step 2", "combine steps 3 and 4 into one PR") as work progresses. Do not open a PR per step automatically.

Steps are ordered by dependency: later steps assume earlier steps are in place. Each step ends with an **Acceptance** checklist that must hold before moving on.

Implementation preference: if an existing tool/library already solves the problem (argument parsing, sorting, data ops, etc.), use it instead of writing custom code.
Implementation quality: avoid repetition (DRY). Shared logic and tunable constants (timeouts, confirmations, polling intervals, etc.) must be centralized behind one helper/config instead of duplicated across handlers.

---

## Step 1 — Skeleton package + interfaces + types

**Goal:** ship the package shell with the contract types, no runtime behavior yet.

**Scope:**
- Create `packages/ens-test-kit/` with `package.json`, `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`, `README.md`.
- Add to monorepo: `pnpm-workspace.yaml`, root `tsconfig` references if applicable, `biome.json` if needed.
- Define `src/interfaces/`:
  - `resolutions.ts` — `ResolutionsApi`
  - `domains.ts` — `DomainsApi`
  - `accounts.ts` — `AccountsApi`
  - `resolvers.ts` — `ResolversApi`
- Define `src/types/`:
  - `Domain`, `Account`, `Resolver`, `Registration`, `Connection<T>`, `DomainsWhere`, `RecordsSelection`, `ResolvedRecords`, `NormalizedName`, `Hex`, `ChainId`, `ResolverId`.
- Define `src/seeder/types.ts`:
  - `Fixture` discriminated union (re-exported from per-fixture files), `FixtureKind`, `FixtureBase`, `SeederContext`.
- Define `src/cases/types.ts`:
  - `TestCase<Api>`.
- Public exports via subpath: `interfaces`, `types`, `cases`, `seeder`, `vitest`, `cli`.

**Acceptance:** package builds, exports type-check, no runtime code yet.

---

## Step 2 — Fixtures + seeder runtime + `seed` CLI + seeded devnet image

**Goal:** the kit owns all seeding, top to bottom; the devnet container seeds itself on startup; orchestrator no longer seeds.

**Scope:**

*Fixtures (one file per fixture kind, each exporting type + builder + handler):*
- `src/seeder/fixtures/reverse-name.ts` — `ReverseNameFixture`, `reverseName(args)`, `applyReverseNameFixture(fixture, ctx)`.
- `src/seeder/fixtures/text-record.ts`
- `src/seeder/fixtures/multicoin-address.ts`
- `src/seeder/fixtures/contenthash.ts`
- `src/seeder/fixtures/pubkey.ts`
- `src/seeder/fixtures/abi.ts`
- `src/seeder/fixtures/interface-record.ts`
- Each handler ports the existing logic from [packages/integration-test-env/src/seed/primary-names.ts](packages/integration-test-env/src/seed/primary-names.ts) and [packages/integration-test-env/src/seed/resolver-records.ts](packages/integration-test-env/src/seed/resolver-records.ts).

*Seeder runtime:*
- `src/seeder/index.ts`:
  - `createSeederContext(rpcUrl)` — wallet clients (deployer, owner, user, user2).
  - `seedFixtures(rpcUrl, fixtures)` — dedupe by id, preserve fixture input order, dispatch to handlers.
  - `dedupeFixtures` **must throw** when two fixtures share an `id` but are not deeply equal (use structural equality on fixture fields, ignoring object identity). Silent dedup is disallowed — it would let a second case override a first case's on-chain state and pass against the wrong fixture. Include both fixtures' JSON in the thrown error message for fast diagnosis.
- `src/seeder/fixtures/common.ts`:
  - `canonicalFixtures` — the union of fixtures that match what's seeded today.

*CLI:*
- `src/cli/seed.ts`: parses `--rpc <url>` and `--fixtures <set>` (defaults to canonical) using an existing parser utility/library, calls `seedFixtures`, prints a readable per-name summary on success.
- `bin/ens-test-kit` declared in `package.json#bin`. Single subcommand: `seed`. No `up`.

*Docker image:*
- `packages/ens-test-kit/devnet/Dockerfile` — multi-stage:
  - Build stage: pull workspace lockfile + kit source from monorepo build context, run `pnpm -F ens-test-kit build`.
  - Runtime stage: `FROM ghcr.io/ensdomains/contracts-v2:main-9f26a8f`, install Node, copy in built kit + `entrypoint.sh`.
- `packages/ens-test-kit/devnet/entrypoint.sh`:
  - Start `./script/runDevnet.ts --testNames` in the background.
  - Wait until Anvil JSON-RPC at `localhost:8545` is responsive.
  - Run `node /opt/ens-test-kit/cli.js seed --rpc http://localhost:8545`.
  - Only after seeding succeeds, expose the contracts-v2 health endpoint as healthy. Implementation hook: contracts-v2's `runDevnet.ts` already serves `/health` on `:8000`; either hold a small proxy in front of it that returns 503 until seeding completes, or set a sentinel file the existing `/health` checker reads. Decide during implementation; flag for review.
  - `wait` on the devnet process so the container stays up.
- Update [docker/services/devnet.yml](docker/services/devnet.yml):
  - Replace `image: ghcr.io/ensdomains/contracts-v2:main-9f26a8f` with `build: { context: ../.., dockerfile: packages/ens-test-kit/devnet/Dockerfile }`.
  - Keep healthcheck config; semantics are now "anvil up *and* seeded".
  - Once we publish a tagged image of this Dockerfile (out of scope here), revert to `image:` with that tag.

*Orchestrator:*
- Remove the `seedDevnet()` call from [packages/integration-test-env/src/orchestrator.ts](packages/integration-test-env/src/orchestrator.ts) phase 2. The container's `service_healthy` wait is now sufficient.
- Delete now-unused [packages/integration-test-env/src/seed/primary-names.ts](packages/integration-test-env/src/seed/primary-names.ts), [packages/integration-test-env/src/seed/resolver-records.ts](packages/integration-test-env/src/seed/resolver-records.ts), [packages/integration-test-env/src/seed/index.ts](packages/integration-test-env/src/seed/index.ts).

**Acceptance:**
- `docker compose -f docker/services/devnet.yml up devnet` produces a seeded chain reachable at `localhost:8545`. `cast call` against the resolver returns the expected records; `cast call` against the reverse resolver returns the expected primary name.
- `pnpm -F integration-test-env start` produces identical end-to-end behavior; existing integration tests pass without modification.
- Devnet container's healthcheck only flips green after seeding completes (verifiable by tailing entrypoint logs vs `docker inspect`'s `Health.Status` transitions).

---

## Step 3 — Test case framework + first port (resolution via REST)

**Goal:** prove the case-and-runner abstraction end-to-end with one concern.

**Scope:**
- Implement `src/cases/expectation.ts` — `Expectation` discriminated union + `expectation.{partial,equals,arrayContains}` builders (see [IDEA.md](./IDEA.md#a-testcase-is-just-data)). `EXPECTATION` sentinel is a `Symbol.for(...)` so the tag survives module-boundary crossing in workspaces.
- Implement `src/vitest/run-suite.ts` — `runSuite<Api>(adapter, cases)`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { type Expectation, isExpectation } from "../cases/expectation";

  export function runSuite<Api>(adapter: Api, cases: TestCase<Api>[]): void {
    describe(`suite (${cases.length} cases)`, () => {
      it.each(cases)("$id — $description", async (tc) => {
        const actual = await tc.call(adapter);
        if (isExpectation(tc.expected)) {
          assertExpectation(actual, tc.expected);
        } else {
          expect(actual).toMatchObject(tc.expected as object);
        }
      });
    });
  }

  function assertExpectation(actual: unknown, e: Expectation): void {
    switch (e[EXPECTATION]) {
      case "partial":       expect(actual).toMatchObject(e.value as object); return;
      case "equals":        expect(actual).toEqual(e.value); return;
      case "arrayContains": expect(actual).toEqual(expect.arrayContaining(e.items)); return;
    }
  }
  ```
  Cases never import Vitest. The translation from the data DSL to Vitest matchers happens only here, inside the runner.
- Add a lint check (or unit test) that scans the `src/cases/` tree and fails if any file imports `vitest` or references `expect.` — the "no Vitest in cases" invariant is worth enforcing mechanically.
- Implement `src/cases/resolution/forward.ts` and `reverse.ts` — port positive-path cases from:
  - [resolve-records.integration.test.ts](apps/ensapi/src/handlers/api/resolution/resolve-records.integration.test.ts) (positive paths)
  - [resolve-primary-name.integration.test.ts](apps/ensapi/src/handlers/api/resolution/resolve-primary-name.integration.test.ts) (positive paths)
  - [resolve-primary-names.integration.test.ts](apps/ensapi/src/handlers/api/resolution/resolve-primary-names.integration.test.ts) (positive paths)
  - Cases derive `expected` values from referenced fixtures.
- Add `RestAdapter` in `packages/integration-test-env/src/adapters/rest-adapter.ts` implementing `ResolutionsApi`.
- Add `packages/integration-test-env/src/tests/resolution-rest.integration.test.ts` calling `runSuite(restAdapter, [...forwardResolutionCases, ...reverseResolutionCases])`.
- Trim ported cases out of the original `apps/ensapi/src/handlers/api/resolution/*.integration.test.ts` files; **keep** the validation/400 cases there (they're transport-specific).

**Acceptance:** new tests pass against running ENSNode; old test files reduced to validation-only with all positive paths now driven by the kit; CI green.

---

## Step 4 — Domains, Accounts, Resolvers cases via Omnigraph adapter

**Goal:** widen the kit beyond resolution to cover the omnigraph surface.

**Scope:**
- Implement `OmnigraphAdapter` in `packages/integration-test-env/src/adapters/omnigraph-adapter.ts`:
  - One method per interface method.
  - Hand-written GraphQL queries (codegen optional, defer if straightforward).
  - Implements `DomainsApi`, `AccountsApi`, `ResolversApi`.
- Build initial cases:
  - `src/cases/domains/by-name.ts` — getDomainByName for known seeded names.
  - `src/cases/domains/subdomains.ts` — parent/sub relationships from existing devnet (parent.eth, sub.parent.eth, sub1.sub2.parent.eth).
  - `src/cases/domains/listing.ts` — `listDomains` with where clauses.
  - `src/cases/accounts/owned-domains.ts` — owner account's domain list (uses `DomainsApi & AccountsApi`).
  - `src/cases/resolvers/indexed-records.ts` — `listResolverRecords` returns the keys/coinTypes set on test.eth.
- Add per-concern test files in `packages/integration-test-env/src/tests/`.

**Acceptance:** four new test files run cases through `OmnigraphAdapter`; existing test files unchanged.

---

## Step 5 — Backfill missing scenarios

**Goal:** close the coverage gaps documented in [Task 0004](.memory-bank/tasks/0004-ensnode-tests/PLAN.md).

**Scope (each item adds fixtures + cases; some require contracts-v2 capability checks):**
- Wildcard resolver scenario.
- Wrapped name (NameWrapper).
- Expired name (use `evm_setNextBlockTimestamp` in seeder, or contracts-v2 helper if available).
- Multi-coin reverse resolvers (Base, Linea) on owner address.
- Custom CCIP/offchain resolver (if devnet supports — investigate during implementation; otherwise punt to its own task).
- ENSv1 vs ENSv2 reverse resolver variants for the same address.

Cases are added file-by-file per scenario; fixtures gain new builders as needed. Each scenario claims its own name to avoid collisions.

**Acceptance:** new cases pass against the omnigraph and (where applicable) the REST adapter; documentation in the kit's README enumerates available fixture types and seeded names.

---

## Step 6 — Resolution adapter for omnigraph (after [Task 0003](.memory-bank/tasks/0003-omnigraph-resolution-api/PLAN.md))

**Goal:** once omnigraph exposes resolution, run the same resolution cases through it for free.

**Scope:**
- `OmnigraphAdapter` additionally implements `ResolutionsApi`.
- Add `packages/integration-test-env/src/tests/resolution-omnigraph.integration.test.ts` running the same case set through `OmnigraphAdapter`.
- Cases are unchanged. The same `forwardResolutionCases` array now exercises both REST and GraphQL.

**Acceptance:** one source of resolution truth, two transports validated; any divergence between REST and GraphQL surfaces as a test failure.

---

## Definition of done for the proposal

This plan is ready for implementation when:
- The two-package shape is approved (`ens-test-kit` + slimmed `integration-test-env`).
- The interface segregation (4 narrow interfaces) is approved.
- One-file-per-fixture-kind layout (declaration + builder + handler combined) is approved.
- "Over-fetch in V1, no `select`" is approved.
- The Docker-side seeding model (devnet image self-seeds; orchestrator doesn't seed; no kit `up` command) is approved.
- The `seed` CLI as the kit's single binary entry point is approved.
- The step sequence is approved (or a different sequencing is agreed).
