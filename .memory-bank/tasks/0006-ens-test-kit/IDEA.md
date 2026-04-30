# Task 0006: `@ensnode/ens-test-kit` — declarative ENS testing framework (Idea)

## Status

Proposal for review. Authored after iterative design conversation. Once approved, see [IMPL.md](./IMPL.md) for the PR-by-PR rollout.

---

## Why we need this

Previous idea described in [#1994](https://github.com/namehash/ensnode/pull/1994) with integration tests are imperative and triple-coupled (transport, fixture, assertion).

Look at the heaviest case in [resolve-records.integration.test.ts](apps/ensapi/src/handlers/api/resolution/resolve-records.integration.test.ts):

```ts
{
  description: "resolves every supported record type for test.eth",
  name: "test.eth",
  query: ["name=true", "addresses=60,0,2", "texts=avatar,...", ...].join("&"),
  expectedStatus: 200,
  expectedBody: {
    records: { addresses: { 60: accounts.owner.address, 0: fixtures.bitcoinAddress, ... } },
    accelerationRequested: false, accelerationAttempted: false,
  },
}
```

Problems:

1. **What is seeded on devnet** (in [packages/integration-test-env/src/seed/resolver-records.ts](packages/integration-test-env/src/seed/resolver-records.ts)) is implicit. You need to always go to check what data we have onchain to write testcase.

2. **The query and expected body are HTTP-shaped.** Once we add resolution to Omnigraph, the same protocol-level case ("test.eth's avatar resolves to X") gets reimplemented as a GraphQL query with a different expected shape.

3. **Adding a new edge case requires editing two distant places** (the seeder + the test file). There is no canonical "what does ENSNode's test environment contain?" catalog.

4. We probably also want to test the `enssdk` wrapper, which would be yet another boilerplate layer.

5. This approach cannot be reused by other ENS teams. A single shared catalog of test cases would invite the wider ENS community to contribute coverage upstream (PRs adding cases, forks adapting cases for their own resolvers) and grow our test suite collectively.

So, summing it up, current idea does not scale. The omnigraph surface alone (Domains, Accounts, Resolvers, Registrations, plus future Resolution) will produce hundreds of cases. We need a structure that absorbs them without quadratic per-transport duplication.

## What `@ensnode/ens-test-kit` is

A new package with a single responsibility: **declarative ENS testing primitives**.

It contains:
- **Narrow API interfaces** (`ResolutionsApi`, `DomainsApi`, `AccountsApi`, `ResolversApi`) — typed query surface that test cases call against.
- **Fixtures** — declarative chain-state preconditions. Each fixture's declaration type, builder, and on-chain handler live together in one file.
- **Seeder runtime** — applies fixtures to an `ens-test-env` devnet over RPC.
- **Test case catalog** — typed `TestCase<Api>[]` collections, organized by concern.
- **Vitest helper** — `runSuite(adapter, cases)` wires cases into a vitest suite.
- **`seed` CLI** — single binary that takes an RPC URL and applies the canonical fixture set.
- **Seeded-devnet Docker image** — extends `contracts-v2` and runs `seed` on container start, so a seeded devnet is one `docker compose up devnet` away.

## What it is NOT

- Not a production SDK. Interfaces exist *only* for testing; they are not how applications should talk to ENSNode.
- Not wired to ENSNode. The kit knows nothing about `postgres`, `ponder`, `ENSIndexer`, `ENSApi`. It runs against `devnet` with the contracts-v2 deployment and exports tooling to write ens test easily
- Not consrtaint to a transport. Each interface admits multiple implementations.

## Where things live

> NOTE: naming is in draft. I just want to show basic idea

```
packages/
  ens-test-kit/                      NEW — universal, transport-agnostic
    src/
      interfaces/                    ResolutionsApi, DomainsApi, AccountsApi, ResolversApi
      types/                         shared shapes: Domain, Account, Resolver, Registration, ...
      cases/                         typed TestCase<Api>[] collections
        resolution/{forward,reverse}.ts
        domains/{by-name,subdomains,listing}.ts
        accounts/owned-domains.ts
        resolvers/indexed-records.ts
      seeder/
        index.ts                     applies fixtures to a devnet
        fixtures/                    declaration + builder + on-chain handler per fixture kind, one file each
          common.ts                  common canonical fixtures — the union of fixtures cases reference
          primary-name.ts
          text-record.ts
          multicoin-address.ts
          contenthash.ts
          registration.ts
          ...
      vitest/                        runSuite() helper
      cli/                           `seed` command implementation
    bin/
      ens-test-kit                   CLI binary (single subcommand: `seed`)
    devnet/
      Dockerfile                     extends contracts-v2; seeds on startup
      entrypoint.sh                  runs runDevnet.ts + waits for health + runs seed

  integration-test-env/              EXISTING — slimmed
    src/
      orchestrator.ts                no longer seeds; devnet container does it
      adapters/                      NEW — implementations of kit's interfaces
        omnigraph-adapter.ts         implements DomainsApi, AccountsApi, ResolversApi
        rest-adapter.ts              implements ResolutionsApi
      tests/                         NEW — runSuite calls per concern × adapter
        resolution-rest.integration.test.ts
        domains-omnigraph.integration.test.ts
        accounts-omnigraph.integration.test.ts
        resolvers-omnigraph.integration.test.ts

docker/
  services/
    devnet.yml                       UPDATED — points at the kit's seeded dockerfile
```

Dependency direction:

```
@ensnode/ens-test-kit                     (no ENSNode dependencies)
    ▲
    │
    └── @ensnode/integration-test-env     (orchestrator + adapters + test wiring)
```

## How a test case looks

### The narrow interfaces

```ts
interface ResolutionsApi {
  resolveRecords(name: NormalizedName, selection: RecordsSelection): Promise<ResolvedRecords>;
  resolvePrimaryName(address: Hex, chainId: ChainId): Promise<string | null>;
  resolvePrimaryNames(address: Hex, chainIds?: ChainId[]): Promise<Record<ChainId, string | null>>;
}

interface DomainsApi {
  getDomainByName(name: NormalizedName): Promise<Domain | null>;
  getDomainByNamehash(node: Hex): Promise<Domain | null>;
  listDomains(where: DomainsWhere): Promise<Connection<Domain>>;
  getRegistration(name: NormalizedName): Promise<Registration | null>;
}

interface AccountsApi {
  getAccount(address: Hex): Promise<Account | null>;
}

interface ResolversApi {
  getResolver(id: ResolverId): Promise<Resolver | null>;
  listResolverRecords(name: NormalizedName): Promise<{ keys: string[]; coinTypes: ChainId[] }>;
}
```

Selection params are deliberately omitted in `ens-test-kit V1`. Adapters always over-fetch a stable shape (e.g. `Domain` includes `owner`, `registration`, `subdomains`). Tests use partial matching (`toMatchObject`) and only assert on what they care about. Field selection can be added later if the over-fetch becomes painful.

### A `TestCase` is just data

```ts
type TestCase<Api> = {
  id: string;
  description: string;
  fixtures: Fixture[];                       // declarative preconditions
  call: (api: Api) => Promise<unknown>;      // what to perform over API. should be simple logic
  expected: unknown;                         // partial shape to match against
};
```

The case is generic in the API it requires. TypeScript enforces case-vs-adapter compatibility at compile time. No runtime tagging.

### Example: a resolution case

```ts
// ens-test-kit/src/cases/resolution/forward.ts
import { textRecord } from "../../seeder/fixtures/text-record";
import type { ResolutionsApi, TestCase } from "../..";

const testEthAvatar = textRecord({
  id: "test-eth-avatar",
  name: "test.eth",
  key: "avatar",
  value: "https://example.com/avatar.png",
});

export const forwardResolutionCases: TestCase<ResolutionsApi>[] = [
  {
    id: "forward.text.test-eth-avatar",
    description: "resolves avatar text record for test.eth",
    fixtures: [testEthAvatar],
    call: (api) => api.resolveRecords("test.eth", { texts: ["avatar"] }),
    expected: { texts: { avatar: testEthAvatar.value } },
  },
  {
    id: "forward.text.unset",
    description: "returns null for unset text record",
    fixtures: [],
    call: (api) => api.resolveRecords("test.eth", { texts: ["nonexistent.key"] }),
    expected: { texts: { "nonexistent.key": null } },
  },
];
```

`expected` derives from the fixture (`testEthAvatar.value`), so a change to seeded data automatically updates the expectation. Drift is impossible.

### Example: a domains case (omnigraph-only)

```ts
// ens-test-kit/src/cases/domains/subdomains.ts
import { registration } from "../../seeder/fixtures/registration";
import type { DomainsApi, TestCase } from "../..";

const parentEth = registration({ id: "parent-eth", name: "parent.eth", owner: "owner" });
const subParentEth = registration({
  id: "sub-parent-eth",
  name: "sub.parent.eth",
  owner: "owner",
  parent: parentEth,
});

export const subdomainCases: TestCase<DomainsApi>[] = [
  {
    id: "domains.subdomains.parent-eth-has-sub",
    description: "parent.eth lists sub.parent.eth as a subdomain",
    fixtures: [parentEth, subParentEth],
    call: (api) => api.getDomainByName("parent.eth"),
    expected: {
      name: "parent.eth",
      subdomains: [{ name: "sub.parent.eth" }],
    },
  },
];
```

A case using both interfaces declares the intersection explicitly:

```ts
// ens-test-kit/src/cases/accounts/owned-domains.ts
export const ownershipCases: TestCase<DomainsApi & AccountsApi>[] = [
  {
    id: "accounts.owns.owner-owns-test-eth",
    description: "owner account's domains include test.eth",
    fixtures: [/* references existing seeded fixtures */],
    call: async (api) => {
      const account = await api.getAccount(OWNER_ADDRESS);
      return account?.domains.map((d) => d.name);
    },
    expected: expect.arrayContaining(["test.eth"]),
  },
];
```

## How a fixture looks

A fixture's **declaration type**, **builder**, and **on-chain handler** all live in one file under `src/seeder/fixtures/`. Adding a new fixture kind = one new file (three exports) + one entry in the seeder dispatcher.

```ts
// ens-test-kit/src/seeder/fixtures/text-record.ts
import { ResolverABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";
import { namehash } from "viem";
import type { NormalizedName } from "../../types";
import type { SeederContext } from "../types";

export type TextRecordFixture = {
  kind: "text-record";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  key: string;
  value: string;
};

export function textRecord(args: Omit<TextRecordFixture, "kind">): TextRecordFixture {
  return { kind: "text-record", ...args };
}

export async function applyTextRecord(
  fixture: TextRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const node = namehash(fixture.name);
  const hash = await ctx.clients.owner.writeContract({
    address: fixture.resolverAddress ?? contracts.permissionedResolver,
    abi: ResolverABI,
    functionName: "setText",
    args: [node, fixture.key, fixture.value],
  });
  await ctx.clients.owner.waitForTransactionReceipt({ hash });
}
```

This is mechanically the same logic that lives today in [packages/integration-test-env/src/seed/resolver-records.ts](packages/integration-test-env/src/seed/resolver-records.ts). The migration is purely a relocation + interface change (handler takes a `Fixture`, not raw args).

### How seeding works end-to-end

```ts
// ens-test-kit/src/seeder/index.ts
import { applyTextRecord } from "./fixtures/text-record";
import { applyPrimaryName } from "./fixtures/primary-name";
// ...

const HANDLERS = {
  "text-record": applyTextRecord,
  "primary-name": applyPrimaryName,
  "multicoin-address": applyMulticoinAddress,
  "contenthash": applyContenthash,
  "registration": applyRegistration,
  // ...
} as const;

export async function seedFixtures(rpcUrl: string, fixtures: Fixture[]): Promise<void> {
  const ctx = createSeederContext(rpcUrl);
  const deduped = dedupeFixtures(fixtures);                 // by id
  const ordered = topologicallySort(deduped);               // registrations before records, etc.
  for (const fixture of ordered) {
    const handler = HANDLERS[fixture.kind];
    await handler(fixture as never, ctx);
  }
}
```

The seeder is idempotent at the fixture level (same `id` → applied once). Topological ordering handles dependencies (you must register `parent.eth` before setting records on `sub.parent.eth`).

## How seeding plugs into Docker

We do not seed from `orchestrator.ts` anymore. The devnet container seeds itself on startup.

1. `packages/ens-test-kit/devnet/Dockerfile` is multi-stage. The build stage compiles the kit (TypeScript → JS). The runtime stage extends `ghcr.io/ensdomains/contracts-v2:main-9f26a8f`, layers in Node and the built kit, and ships an `entrypoint.sh` that:
   - Starts `./script/runDevnet.ts --testNames` in the background.
   - Waits for Anvil to accept JSON-RPC on `localhost:8545`.
   - Runs `ens-test-kit seed --rpc http://localhost:8545` against the local Anvil.
   - Only then exposes the `localhost:8000/health` endpoint as healthy (so dependents wait for *seeded*, not just *anvil-booted*).
   - `wait`s on the devnet process so the container stays up.
2. [docker/services/devnet.yml](docker/services/devnet.yml) is updated to build from this Dockerfile (build context = monorepo root, so the workspace lockfile is available). Once we publish a tagged image, this service can switch back to `image:`.
3. Anyone — CI, local devs, external users — gets a seeded devnet with `docker compose -f docker/services/devnet.yml up devnet`. No orchestrator, no ENSNode stack, no kit binary install.
4. [packages/integration-test-env/src/orchestrator.ts](packages/integration-test-env/src/orchestrator.ts) drops its `seedDevnet()` call entirely. The container handles seeding before its healthcheck reports healthy.

The kit's only standalone CLI entry point is `ens-test-kit seed --rpc <url>`. There is no `up` command — bringing up the chain is `docker compose ... up devnet`'s job.

## What stays where

1. **Fixture declarations + builders + handlers**  
   Today: [seed/primary-names.ts](packages/integration-test-env/src/seed/primary-names.ts), [seed/resolver-records.ts](packages/integration-test-env/src/seed/resolver-records.ts)  
   After: `ens-test-kit/seeder/fixtures/*` (one file per fixture kind, type+builder+handler combined).

2. **`seedDevnet()` entry**  
   Today: [seed/index.ts](packages/integration-test-env/src/seed/index.ts), called from orchestrator  
   After: `ens-test-kit/seeder/index.ts`, called by the devnet container's entrypoint.

3. **Devnet startup seeding**  
   Today: orchestrator phase 2  
   After: devnet container entrypoint (before health passes).

4. **Devnet constants (contract addrs, accounts, fixture values)**  
   Today: `@ensnode/datasources/devnet`  
   After: `@ensnode/ens-test-kit/devnet` is the source of truth; both kit internals and adapters import from it.

5. **Positive-path integration test cases**  
   Today: `apps/ensapi/src/handlers/api/.../*.integration.test.ts`  
   After: `ens-test-kit/cases/*`; runners in `integration-test-env/tests/`.

6. **Validation/4xx tests**  
   Today: same files  
   After: stay in `apps/ensapi` (transport-specific, not part of kit).

7. **Orchestrator**  
   Today: seeds + runs services  
   After: runs services only; depends on devnet container being healthy = seeded.

8. **`services/devnet.yml`**  
   Today: uses upstream contracts-v2 image  
   After: builds from kit's Dockerfile.

## Design choices and rationale

- **One global devnet, namespace-by-name.** Per-test isolation is impossible because Ponder reindexes on data change and snapshot/revert doesn't reset the indexer DB. All fixtures coexist on one devnet; conflicting scenarios use different names (`with-avatar.example.eth` vs `without-avatar.example.eth`). This matches what reference test envs (ensjs deploy scripts) effectively do.
- **Interfaces are test-only.** Production SDK stays focused; we don't accidentally promise these shapes to external consumers. If they prove valuable as a public API later, promotion is a separate decision.
- **Adapters live in `integration-test-env`.** They're glue between the kit and a running ENSNode stack — the only place they're meaningful. No `ensnode-sdk` coupling.
- **Over-fetch in V1, no `select` param.** Cases assert with `toMatchObject`. Adds selection later if/when over-fetched payloads get unwieldy.
- **TypeScript-first cases, no JSON/YAML format.** All target consumers are TS/JS. Compile-time validation of fixture references is worth more than format-language portability.
- **Seed inside the devnet container, not from the orchestrator.** A seeded devnet is the deliverable; once the kit's image is up, *any* consumer (CI, dev, external resolver team) gets the same seeded chain with one compose command. Removes orchestrator complexity and removes the dev-loop need to "boot the full ENSNode stack to get test data".
- **Single CLI command (`seed`).** No `up`, since `docker compose up devnet` already does that perfectly.
- **One file per fixture kind.** Declaration + builder + on-chain handler co-located: trivial to add a new fixture kind, easy to review, no file-jumping between declaration and runtime.

## Out of scope

- Real-chain (mainnet) validation — that's a follow-up; the kit's resolution adapter could later target viem/UniversalResolver to enable `resolution-eq`-style diffing in CI.
- ENSDb direct-access adapter (asserting indexed state by reading Postgres directly) — possible follow-up; not needed for V1.
- GraphQL subgraph-compat schema testing — possible future use of the kit; out of scope here.
- Schema-agnostic "fact assertions" DSL — over-engineering for the current case load.
