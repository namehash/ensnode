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

## Commands

Runnable commands for validating changes; lint and format with Biome.

- Install dependencies: `pnpm install`
- Run all tests: `pnpm test`
- Run tests for a single package/app: `pnpm --filter <package-name> test` (e.g. `pnpm --filter ensapi test`)
- Lint and format: `pnpm lint` (fixes where applicable); CI lint: `pnpm lint:ci`
- Type checking: `pnpm typecheck` (runs typecheck in all workspaces)

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

Fail fast and loudly on invalid inputs.

- **Validation — API requests:** Use the existing Hono validation middleware (Zod schemas + `validate()` from `apps/ensapi/src/lib/handlers/validate.ts`). Failed validation becomes a 400 response with structured details via `errorResponse`; handlers receive already-validated data. Do not manually call `zod.parse`/`safeParse` in route handlers for request body/params/query when this middleware is in use.
- **Validation — non-API code (config, SDK, scripts):** Use `zod.parse(...)` when invalid input should throw immediately; use `zod.safeParse(...)` when you need a non-throwing branch (e.g. optional or fallback). Prefer `parse` for fail-fast.
- **Error types:** Use plain `Error` (or `ZodError` when propagating Zod validation errors). The codebase does not define a custom hierarchy (e.g. `AppError`/`ValidationError`); do not introduce one unless the project adopts it. Use `throw new Error("message")` from application code.
- **API boundaries:** Use the shared `errorResponse` helper (`apps/ensapi/src/lib/handlers/error-response.ts`) for all error responses in ENSApi (and equivalent pattern in other Hono apps). Mapping: validation (ZodError / Standard Schema) → 400 with `{ message, details }`; other known client errors → 4xx with `{ message }`; server errors → 500 with `{ message }`. Response shape: `{ message: string, details?: unknown }` (see `packages/ensnode-sdk/src/ensapi/api/shared/errors/response.ts`). A `code` field may be adopted later for machine-readable codes; do not add it inconsistently today.
- **Examples:** Validation at boundary: route uses `validate("json", MySchema)`; on failure → 400 + `{ message: "Invalid Input", details }`. Non-API: `const config = ConfigSchema.parse(env)` or `const parsed = MySchema.safeParse(input); if (!parsed.success) return fallback;`. Handler: `return errorResponse(c, err)` or `return errorResponse(c, "Not found", 404)`.

## Workflow

- Add a changeset when your PR includes a logical change that should bump versions or be communicated in release notes: https://ensnode.io/docs/contributing/prs/#changesets
