---
paths:
  - "apps/ensapi/**"
---

# API Patterns Rules

Applies when working in `apps/ensapi/`.

## ensapi App Overview

**Purpose**: HTTP API server serving ENSNode's ENS APIs.

**Key Components**:
- **Handlers** (`src/handlers/`): Route handlers for different API endpoints
- **Middleware** (`src/middleware/`): Request processing middleware
- **Cache** (`src/cache/`): SWR cache implementations for data
- **Lib** (`src/lib/`): Shared utilities and helpers

**API Routes**:
- `/api/*` - ENSNode HTTP API
- `/subgraph` - Subgraph-compatible GraphQL API
- `/ensanalytics` - Analytics API (v0)
- `/v1/ensanalytics` - Analytics API (v1)
- `/amirealtime` - Realtime status API

## SWR Cache Pattern

Stale-While-Revalidate caching for async operations:

```typescript
import { SWRCache } from "@ensnode/ensnode-sdk";

export const indexingStatusCache = new SWRCache({
  fn: async () => client.indexingStatus().then(response => {
    if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
      throw new Error("...");
    }
    return response.realtimeProjection.snapshot;
  }),
  ttl: 5, // seconds
  proactiveRevalidationInterval: 10, // seconds
  proactivelyInitialize: true,
});

// Reading from cache
const status = await indexingStatusCache.read();
if (status instanceof Error) {
  // Handle error case
}
```

## Hono Factory Pattern

Type-safe middleware composition via `apps/ensapi/src/lib/hono-factory.ts`:

```typescript
// Define middleware variable types
export type MiddlewareVariables =
  IndexingStatusMiddlewareVariables &
  IsRealtimeMiddlewareVariables &
  CanAccelerateMiddlewareVariables;

// Create typed factory
export const factory = createFactory<{
  Variables: Partial<MiddlewareVariables>;
}>();

// Create typed middleware
export const indexingStatusMiddleware = factory.createMiddleware(
  async (c, next) => {
    c.set("indexingStatus", await indexingStatusCache.read());
    await next();
  }
);
```

## Response Code Pattern

API responses use discriminated unions with response codes:

```typescript
export const ReferrerLeaderboardPageResponseCodes = {
  Ok: "ok",
  Error: "error",
} as const;

export type ReferrerLeaderboardPageResponseOk = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Ok;
  data: ReferrerLeaderboardPage;
};

export type ReferrerLeaderboardPageResponseError = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Error;
  error: string;
  errorMessage: string;
};

export type ReferrerLeaderboardPageResponse =
  | ReferrerLeaderboardPageResponseOk
  | ReferrerLeaderboardPageResponseError;

// Usage with switch/case for exhaustive handling
switch (response.responseCode) {
  case ReferrerLeaderboardPageResponseCodes.Ok:
    return response.data;
  case ReferrerLeaderboardPageResponseCodes.Error:
    throw new Error(response.errorMessage);
}
```

## Hono Route Handler Pattern

```typescript
import { describeRoute } from "hono-openapi";
import { z } from "zod/v4";

const app = factory
  .createApp()
  .use(someMiddleware)
  .get(
    "/referral-leaderboard",
    describeRoute({
      tags: ["ENSAwards"],
      summary: "Get Referrer Leaderboard",
      description: "Returns paginated leaderboard data",
      responses: {
        200: { description: "Success" },
        500: { description: "Internal server error" },
      },
    }),
    validate("query", paginationQuerySchema),
    async (c) => {
      try {
        const { page, recordsPerPage } = c.req.valid("query");
        // ... handler logic
        return c.json(serializeResponse(response));
      } catch (error) {
        logger.error({ error }, "Error in endpoint");
        return c.json(errorResponse, 500);
      }
    },
  );
```

## Validation Schemas

```typescript
const paginationQuerySchema = z.object({
  page: z
    .optional(z.coerce.number().int().min(1, "Page must be positive"))
    .describe("Page number for pagination"),
  recordsPerPage: z
    .optional(
      z.coerce
        .number()
        .int()
        .min(1, "Must be at least 1")
        .max(100, "Must not exceed 100"),
    )
    .describe("Number of records per page"),
});
```

## Adding a New API Endpoint

1. Define types in SDK package (`packages/ensnode-sdk/src/api/`)
2. Add serialization/deserialization functions
3. Add Zod schemas in `zod-schemas.ts`
4. Export from `internal.ts` (for Zod) and `index.ts` (for types)
5. Implement handler in `apps/ensapi/src/handlers/`
6. Add middleware if needed in `apps/ensapi/src/middleware/`
7. Wire up route in `apps/ensapi/src/index.ts`

## Modifying GraphQL Schema

- For ENSApi: Schema definitions are in `apps/ensapi/src/` using Pothos schema builder
- For Subgraph compatibility: See `packages/ponder-subgraph/`
