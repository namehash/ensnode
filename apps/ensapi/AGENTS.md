# ENSApi

Read-only Hono API in front of ENSDb (the indexer's Postgres). Three public surfaces, mounted in `src/app.ts`:

- Omnigraph GraphQL (`/api/omnigraph`) — Pothos+Yoga schema in `src/omnigraph-api/`.
- Legacy Subgraph GraphQL (`/subgraph`) — `@ensnode/ponder-subgraph` middleware.
- REST (`/api/*`) — `@hono/zod-openapi` routes in `src/handlers/api/`.

Default port: `ENSApi_DEFAULT_PORT = 4334` (`src/config/defaults.ts`).

## Cross-service contracts

- ENSApi reads the indexer's DB directly. `ENSDB_URL` + `ENSINDEXER_SCHEMA_NAME` (env) MUST match the running ENSIndexer's DB and schema name, else queries hit a stale/empty schema. Resolved into `EnsDbReader` via the DI container.
- Request/response types and most domain enums/helpers live in `@ensnode/ensnode-sdk`, NOT in this app. Error response shape is `ErrorResponse` from `packages/ensnode-sdk/src/ensapi/api/shared/errors/response.ts`. Add/change wire types there.
- `EnsNodeStackInfo` and indexing status come from the connected ENSIndexer (fetched at startup + cached); feature availability (`hasOmnigraphApiConfigSupport`, `hasSubgraphApiConfigSupport`, `canFallbackToTheGraph`, etc.) is gated on those sdk helpers, not local config.

## DI container (`src/di.ts`)

- Single frozen, lazily-built `di` singleton. `di.init()` runs at startup (verifies ENSDb + root-chain RPC connectivity, warms caches); HTTP server starts immediately, init is non-blocking — early requests may see uninitialized caches.
- Access DB as `di.context.ensDb` / `di.context.ensIndexerSchema`. Do NOT import the schema elsewhere.
- `di.context.stackInfo` is a SYNC getter that throws if the stackInfo cache hasn't loaded — only valid after init.

## Middleware pipeline (`src/lib/hono-factory.ts`)

- Use `createApp({ middlewares: [...] })`, not bare `app.use()`. Middlewares tagged with `producing([...keys])` make their `c.var.<key>` non-optional in handlers AND assert presence at runtime. Order matters — dependents declare their producer (e.g. `canAccelerate` requires `isRealtime` requires `indexingStatus`).
- All `c.var.*` middleware variable types union into `MiddlewareVariables`; add new ones there.

## Realtime / acceleration / fallback (gotchas)

- `indexingStatusMiddleware` reads an SWR cache that retains the last good snapshot even when ENSIndexer is unreachable; on total failure `c.var.indexingStatus` is an `Error` (surfaces 503 on Omnigraph/Subgraph). Always handle the Error branch.
- `isRealtime` = `worstCaseDistance <= maxWorstCaseDistance`. The threshold differs per surface (Resolution 60s, Omnigraph 600s, Subgraph 600s/10min) — don't assume one global value.
- `canAccelerate` (Resolution + Omnigraph) requires the ENSIndexer to have the `ProtocolAcceleration` plugin AND be realtime. Acceleration is currently force-disabled for any ENSv2 namespace (datasource `ENSv2Root` present) — a temporary bailout, not a permanent rule.
- Subgraph API proxies to The Graph (`thegraphFallbackMiddleware`) only when `canFallbackToTheGraph` AND not realtime; falls through to internal handling if the proxy throws. Never falls back when the indexer is not Subgraph-compatible (would corrupt results).

## Error handling

Fail fast and loudly on invalid inputs.

- REST validation is the `@hono/zod-openapi` route `request` schemas; `createApp`'s `defaultHook` routes failures through `errorResponse`. Do NOT call `zod.parse`/`safeParse` on request body/params/query in handlers.
- Use plain `Error` (or propagate `ZodError`). No custom error hierarchy (`AppError`/`ValidationError`) — don't introduce one.
- All error responses go through `errorResponse` (`src/lib/handlers/error-response.ts`): ZodError / Standard Schema → 400 `{ message, details }`; other client errors → 4xx `{ message }`; server errors → 500 `{ message }`. A `code` field may be adopted later; do not add it inconsistently today.
- TOCTOU IS a concern here: reading `ensIndexerSchema` in parallel OR serially can observe different snapshots of the indexer's in-flight writes. Don't assume cross-query consistency.

## Generate

- `pnpm generate` (root) runs `generate:gqlschema` here, which writes the Omnigraph SDL to `packages/enssdk/src/omnigraph/generated/schema.graphql` (the SDK is the source of truth, not this app). Re-run after any change to the Pothos schema in `src/omnigraph-api/`.
- The OpenAPI document is generated from the live routes (`/openapi.json`, `src/openapi-document.ts`); the docs site fetches it. `HIDE_OPENAPI_ENDPOINTS` hides deprecated/legacy routes from the published doc.
- Dev-only GraphQL methods are gated by `INCLUDE_DEV_METHODS`; SDL is NOT written when they're enabled (avoids a dirty schema diff).
