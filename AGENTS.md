# ENSNode

ENSNode is the full-stack ENSv2 development platform: a suite of services and libraries that index the full state of ENS — ENSv1 and ENSv2, across all chains (mainnet, Basenames, Lineanames, 3DNS) — into a unified data model and expose it for integration.

Core narrative (see `docs/ensnode.io` for the canonical versions):

- **ENSDb** — a PostgreSQL database holding the live onchain state of ENS as a single unified data model (the **ENS Unigraph**). An open standard separating Writers (indexers) from Readers (APIs).
- **ENSIndexer** — the reference ENSDb Writer: a Ponder-based multichain indexer combining ENSv1 Nametrees and the ENSv2 Namegraph into ENSDb.
- **ENSApi** — serves ENSNode's APIs on top of ENSDb: the **ENS Omnigraph** GraphQL API (unified ENSv1+ENSv2, Relay spec), the legacy ENS Subgraph GraphQL API (deprecated), and REST APIs.
- **ENSRainbow** — heals unknown labels (labelHash → label) as a sidecar consumed by ENSIndexer.
- **ENSAdmin** — operator dashboard and ENS Protocol Inspector.

## Monorepo Structure

Apps (private, deployed as services):

- `apps/ensindexer` — Multichain ENS indexer, powered by Ponder
- `apps/ensapi` — ENS API server: Omnigraph + Subgraph GraphQL and REST (Hono)
- `apps/ensadmin` — Dashboard for navigating indexed ENS state (Next.js)
- `apps/ensrainbow` — Label healing service (Hono)
- `apps/fallback-ensapi` — AWS Lambda fallback proxying ENS Subgraph requests when ENSApi is unhealthy

Public packages (published to npm — exports are external API surface; changes need changesets):

- `packages/enssdk` — `enssdk`: foundational ENS development library (typed Omnigraph client via gql.tada, hashing, normalization)
- `packages/enskit` — `enskit`: ENS toolkit for React (urql-based Omnigraph hooks)
- `packages/enscli` — `enscli`: agent- and human-friendly CLI for ENS, ENSNode, and the Omnigraph API
- `packages/ensskills` — `ensskills`: agent skills for ENS, installed into consumer repos via skills-npm
- `packages/ensnode-sdk` — SDK for interacting with ENSNode (ENSApi wire types, Omnigraph example queries)
- `packages/ensdb-sdk` — SDK for ENSDb data (owns the indexed schema)
- `packages/ensrainbow-sdk` — SDK for the ENSRainbow API
- `packages/datasources` — Catalog of chain datasources (contracts, start blocks, event filters)
- `packages/ponder-sdk` / `packages/ponder-subgraph` — Ponder utilities / Subgraph-compatible GraphQL middleware
- `packages/ens-referrals` — Utilities for ENS Referrals
- `packages/namehash-ui` — UI components for NameHash Labs apps

Private packages: `packages/ensnode-react`, `packages/scalar-react`, `packages/shared-configs`, `packages/ensindexer-perf-testing`, `packages/integration-test-env`.

Docs & examples: `docs/ensnode.io` (Astro/Starlight), `docs/ensrainbow.io`, `examples/*` (consumer examples for enssdk, enskit, ensskills, and raw Omnigraph GraphQL).

Several projects have their own AGENTS.md with subsystem-specific invariants — it loads automatically when you work in that subtree: `apps/ensindexer`, `apps/ensapi`, `apps/ensrainbow`, `apps/ensadmin`, `apps/fallback-ensapi`, `docs/ensnode.io`, `packages/datasources`, `packages/integration-test-env`.

## Agent Skills

- Internal skills (repo workflows) live in `.agents/skills/` (committed). `pnpm install` mirrors them into `.claude/skills/` via `scripts/link-local-skills.mjs`; never create those symlinks by hand. New internal skills go in `.agents/skills/<name>/SKILL.md`.
- External skills (how to use ENS/ENSNode) live in `packages/ensskills` and are symlinked in as `npm-ensskills-*` by skills-npm (configured in `skills-npm.config.ts`).
- Placement rule: knowledge useful to external integrators (protocol concepts, Omnigraph usage, API contracts) belongs in `packages/ensskills` or `docs/ensnode.io` — never duplicated into internal AGENTS.md files. Internal AGENTS.md files hold repo-internal invariants only.

## Tech Stack

- **Language:** TypeScript
- **Package manager:** pnpm (workspaces with catalog for dependency versioning)
- **API framework:** Hono
- **Indexer framework:** Ponder
- **Validation:** Zod
- **ORM:** Drizzle
- **Linting/formatting:** Biome (TS/JSON), Prettier (md/mdx/astro)
- **Testing:** Vitest
- **Build:** tsup, tsx

## Commands

- Install dependencies: `pnpm install`
- Run all tests: `pnpm test`
  - Single project: `pnpm test --project <project>` (e.g. `pnpm test --project ensapi`)
  - Single file: `pnpm test <path>`
- Lint and format: `pnpm lint` (fixes where applicable); CI lint: `pnpm lint:ci`
- Type checking: `pnpm typecheck` (all workspaces)
  - Always use `pnpm -F <package-name> typecheck`, never call `tsc` or `tsgo` directly
- Codegen: `pnpm generate` (always from the monorepo root, never scoped to a package) — regenerates OpenAPI defs, the Omnigraph GraphQL schema, and ensskills autogen regions

## Local Runtime

Default ports: ENSIndexer `42069`, ENSApi `4334`, ENSAdmin `4173`, ENSRainbow `3223`, Postgres `5432`.

- Each app reads `.env.local` (copy from its `.env.local.example`). Dev startup order: Postgres → `pnpm -F ensrainbow serve` → `pnpm -F ensindexer dev` → `pnpm -F ensapi dev` → `pnpm -F ensadmin dev`.
- Cross-app invariant: ENSIndexer and ENSApi must agree on `ENSDB_URL` and `ENSINDEXER_SCHEMA_NAME` — ENSApi reads the schema ENSIndexer writes. Each running ENSIndexer needs an exclusive schema name.
- Full stack via Docker: `docker compose -f docker/docker-compose.devnet.yml up -d` (zero-config local devnet) or `docker/docker-compose.yml` with `.env.docker.local` (mainnet/sepolia).
- Integration tests: orchestrated by `packages/integration-test-env` (`pnpm test:integration:ci` from root).

## Testing

- Tests are colocated with source files (e.g. `foo.test.ts` next to `foo.ts`).
- Use the `*.test.ts` naming convention. Do not use `*.spec.ts`.
- Use `describe`/`it` blocks with `expect` assertions.
- Use `vi.mock()` for module mocking and `vi.fn()` for function stubs.
- Each app and package has its own `vitest.config.ts`.
- Prefer the `await expect(...).resolves.*` format over await-then-expect.
- Prefer `await expect(...).resolves.toMatchObject({})` over expecting individual properties, if it is more concise.

## Documentation & DRY

- Do not duplicate definitions across multiple locations. Duplication creates a significant maintenance burden.
- Ensure documentation resides at the correct place and the correct layer of responsibility.
- Use type aliases to document invariants. Each invariant MUST be documented exactly once, on its type alias.
- Terminology is exacting in this codebase (Label vs Name, Literal vs Interpreted vs Beautified, Encoded LabelHash, Subregistry, …). The canonical glossary is `docs/ensnode.io/src/content/docs/docs/reference/terminology.mdx` — consult it before naming things; link to it rather than redefining terms.

## Code Comments

- Do not add JSDoc `@returns` tags that merely restate the method summary (e.g. "returns the X" when the description already says "Get the X"). Remove such redundancy during PR review.
- Maintain comment consistency within a file: if most types, schemas, or declarations lack comments, do not add a comment to a single one. Address the inconsistency during PR review.

## Error Handling

Fail fast and loudly on invalid inputs.

- **Non-API code (config, SDK, scripts):** Use `zod.parse(...)` when invalid input should throw immediately; use `zod.safeParse(...)` when you need a non-throwing branch (e.g. optional or fallback). Prefer `parse` for fail-fast.
- **Error types:** Use plain `Error` (or `ZodError` when propagating Zod validation errors). The codebase does not define a custom hierarchy (e.g. `AppError`/`ValidationError`); do not introduce one unless the project adopts it. Use `throw new Error("message")` from application code.
- API request validation and error responses are ENSApi conventions — see `apps/ensapi/AGENTS.md`.

## Workflow

- Add a changeset when your PR includes a logical change that should bump versions or be communicated in release notes: https://ensnode.io/docs/contributing/prs#changesets
  - ENSNode uses non-standard semver: breaking changes are `minor`, not `major`.
  - Prefer a separate changeset per affected service/package when the changes are logically isolated, each describing that package's own change — rather than one changeset bumping several packages with a shared message. A single multi-package changeset is appropriate only when the change is genuinely one indivisible unit (e.g. a wire-format contract shared across packages).
- Before declaring work complete, run validation in the affected project(s):
  1. If OpenAPI Defs or the Omnigraph GraphQL Schema was affected, run `pnpm generate`
     - always run `pnpm generate` from the monorepo root, do NOT scope to a specific package
     - the OpenAPI doc is a committed artifact (`docs/ensnode.io/src/data/ensapi-openapi.json`) and CI fails if it drifts from the ENSApi routes
  2. `pnpm -F <affected-project> typecheck`
     - at the end of a work session, always run `pnpm typecheck` from the monorepo root
  3. `pnpm lint`
     - at the end of a work session, always run `pnpm lint` from the monorepo root
  4. `pnpm test --project <affected-project> [--project <other-affected-project>]`
     - at the end of a work session, always run `pnpm test` from the monorepo root
