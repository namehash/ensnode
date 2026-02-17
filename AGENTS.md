# ENSNode

ENSNode is a multichain ENS indexer monorepo. It indexes ENS names across multiple chains (mainnet, Basenames, Lineanames, 3DNS) and exposes them via GraphQL and REST APIs.

## Monorepo Structure

- `apps/ensindexer` — Blockchain indexer powered by Ponder
- `apps/ensapi` — ENS API server (GraphQL and REST, Hono)
- `apps/ensadmin` — Dashboard for navigating indexed ENS state (Next.js)
- `apps/ensrainbow` — Label healing service: recovers labels from labelHashes (Hono)
- `apps/fallback-ensapi` — AWS Lambda fallback that proxies ENS Subgraph requests when ENSApi is unhealthy
- `packages/ensnode-sdk` — SDK for interacting with ENSNode
- `packages/ensnode-react` — React hooks and providers for ENSNode API
- `packages/ensnode-schema` — Shared Drizzle schema definitions
- `packages/ensrainbow-sdk` — SDK for interacting with ENSRainbow
- `packages/datasources` — Catalog of chain datasources (contracts, start blocks, event filters)
- `packages/ponder-subgraph` — Hono middleware for Subgraph-compatible GraphQL
- `packages/ponder-sdk` — Utility library for interacting with Ponder apps and data
- `packages/ponder-metadata` — Hono middleware that exposes Ponder app metadata to clients
- `packages/ens-referrals` — Utilities for ENS Referrals
- `packages/namehash-ui` — UI components for NameHash Labs apps
- `packages/shared-configs` — Shared TypeScript configurations
- `docs/ensnode.io` — Documentation site (Astro/Starlight)

## Tech Stack

- **Language:** TypeScript
- **Package manager:** pnpm (workspaces with catalog for dependency versioning)
- **API framework:** Hono
- **Indexer framework:** Ponder
- **Validation:** Zod
- **ORM:** Drizzle
- **Linting/formatting:** Biome
- **Testing:** Vitest
- **Build:** tsup, tsx

## Testing

- Tests are colocated with source files (e.g. `foo.test.ts` next to `foo.ts`).
- Use the `*.test.ts` naming convention. Do not use `*.spec.ts`.
- Use `describe`/`it` blocks with `expect` assertions.
- Use `vi.mock()` for module mocking and `vi.fn()` for function stubs.
- Each app and package has its own `vitest.config.ts`.

## Documentation & DRY

- Do not duplicate definitions across multiple locations. Duplication creates a significant maintenance burden.
- Ensure documentation resides at the correct place and the correct layer of responsibility.
- Use type aliases to document invariants. Each invariant MUST be documented exactly once, on its type alias.

## Code Comments

- Do not add JSDoc `@returns` tags that merely restate the method summary (e.g. "returns the X" when the description already says "Get the X"). Remove such redundancy during PR review.
- Maintain comment consistency within a file: if most types, schemas, or declarations lack comments, do not add a comment to a single one. Address the inconsistency during PR review.

## Error Handling

- Fail fast and loudly on invalid inputs.

## Workflow

- All changes require changesets: https://ensnode.io/docs/contributing/prs/#changesets
