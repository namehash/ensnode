---
paths:
  - "packages/**"
---

# SDK Development Rules

Applies when working in `packages/`.

## Serialization/Deserialization Pattern

The codebase uses a strict pattern for API data transfer:

```typescript
// 1. Define domain types (runtime representation)
interface ReferrerMetrics {
  referrer: Address;
  totalRevenueContribution: RevenueContribution; // bigint
}

// 2. Define serialized types (JSON-safe representation)
interface SerializedReferrerMetrics {
  referrer: Address;
  totalRevenueContribution: string; // bigint → string
}

// 3. Create serialize function
function serializeReferrerMetrics(
  metrics: ReferrerMetrics
): SerializedReferrerMetrics {
  return {
    referrer: metrics.referrer,
    totalRevenueContribution: metrics.totalRevenueContribution.toString(),
  };
}

// 4. Create deserialize function with Zod validation
function deserializeReferrerMetrics(
  serialized: SerializedReferrerMetrics
): ReferrerMetrics {
  // First deserialize, then validate with Zod
  const deserialized = { ... };
  const parsed = schema.safeParse(deserialized);
  if (parsed.error) throw new Error(...);
  return parsed.data;
}
```

## Internal Module Pattern

Zod schemas and internal utilities are isolated in `/internal` exports so the public API stays free of Zod:

```typescript
// packages/ensnode-sdk/src/internal.ts
/**
 * Internal APIs
 *
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 */
export * from "./api/indexing-status/zod-schemas";
export * from "./shared/zod-schemas";
// ... more internal exports
```

Usage within monorepo:
```typescript
// Import from /internal path for Zod schemas
import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";
```

When adding Zod schemas: export from `internal.ts`, never from `index.ts`.

## Builder Pattern with Type Safety

Domain objects are created via builder functions with type validation:

```typescript
export const buildReferrerMetrics = (
  referrer: Address,
  totalReferrals: number,
  ...
): ReferrerMetrics => {
  const result = {
    referrer: normalizeAddress(referrer),
    totalReferrals,
    ...
  } satisfies ReferrerMetrics;

  return result;
};
```

## `@ensnode/ensnode-sdk` Package

**Purpose**: Core SDK for interacting with ENSNode services.

**Key Exports**:
- `ENSNodeClient` - Main client class for API interaction
- Types for resolution, indexing status, configuration
- Utility functions for ENS data manipulation
- `SWRCache`, `LRUCache`, `TTLCache` - Caching utilities

**Structure**:
```
src/
├── api/                 # API types and (de)serialization
│   ├── config/
│   ├── indexing-status/
│   ├── name-tokens/
│   ├── registrar-actions/
│   ├── resolution/
│   └── shared/
├── client.ts           # ENSNodeClient implementation
├── ens/                # ENS-specific types and utilities
├── ensapi/             # ENSApi-specific types
├── ensindexer/         # ENSIndexer-specific types
├── shared/             # Shared utilities
│   ├── cache/          # Caching implementations
│   ├── config/         # Configuration utilities
│   └── ...
├── index.ts            # Public API exports
└── internal.ts         # Internal-only exports (Zod schemas)
```

## `@ensnode/ponder-sdk` Package

**Purpose**: Utility library for interacting with Ponder apps and data.

**Key Exports**: block/time utilities, indexing status/metrics types, deserialization helpers for Ponder API responses, chain helpers.

## Adding New Domain Types

1. Define interface with JSDoc comments and `@invariant` tags
2. Create `build*` function with type-safe construction using `satisfies`
3. Add serialized type variant if needed for API transport (e.g., bigint → string)
4. Add serialize/deserialize functions with Zod validation
5. Export types from `index.ts` and Zod schemas from `internal.ts`

## Adding a New Package

1. Create directory in `packages/`
2. Set up `package.json` with workspace dependencies (`workspace:*` protocol)
3. Configure exports (main and `/internal` if needed)
4. Add `tsconfig.json` extending shared config
5. Add `vitest.config.ts`
6. Add `tsup.config.ts` for build
