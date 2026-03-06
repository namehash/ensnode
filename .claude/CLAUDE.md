# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

ENSNode is a multichain ENS indexer built on Ponder, providing backwards-compatible ENS Subgraph queries and multichain support for ENSv1, ENSv2, Basenames, Lineanames, 3DNS, and more. The repository is a pnpm monorepo with apps, packages, and documentation.

### Key Concepts

- **Multichain Support**: Indexes mainnet, Basenames (`.base.eth`), Lineanames (`.linea.eth`), 3DNS, and more
- **Protocol Acceleration**: Optimized resolution for indexed names
- **Subgraph Compatibility**: 100% data equivalency with ENS Subgraph
- **ENSIP Standards**: Follows ENS Improvement Proposals (especially ENSIP-19 for multichain primary names)

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | ^5.7.3 | Primary language |
| **Node.js** | >=24.13.0 | Runtime |
| **pnpm** | 10.28.0 | Package manager |
| **Ponder** | 0.16.2 | Blockchain indexing framework |
| **Drizzle ORM** | 0.41.0 | Database ORM |
| **PostgreSQL** | - | Data storage |
| **Viem** | ^2.22.13 | Ethereum interactions |
| **Hono** | ^4.11.7 | HTTP server framework |
| **Biome** | ^2.3.1 | Linting and formatting |
| **Vitest** | ^4.0.2 | Testing framework |
| **Zod** | ^4.3.6 | Schema validation |

### Repository Structure

```
ensnode/
├── apps/                    # Executable applications
│   ├── ensadmin/           # Dashboard (React/Next.js)
│   ├── ensapi/             # HTTP API server (Hono)
│   ├── ensindexer/         # Ponder-based indexer
│   ├── ensrainbow/         # Label recovery service
│   └── fallback-ensapi/    # Fallback API implementation
├── packages/               # Reusable libraries
│   ├── ensnode-sdk/        # Core SDK for ENSNode interaction
│   ├── ens-referrals/      # Referral program utilities
│   ├── ensnode-react/      # React hooks and providers
│   ├── ensnode-schema/     # Drizzle schema definitions
│   ├── ensrainbow-sdk/     # ENSRainbow client SDK
│   ├── datasources/        # Chain/contract configurations
│   ├── ponder-sdk/         # Utility library for Ponder app interaction
│   ├── ponder-subgraph/    # Subgraph-compatible GraphQL API
│   ├── ponder-metadata/    # Metadata utilities for Ponder
│   ├── namehash-ui/        # Shared UI components
│   └── shared-configs/     # Shared configuration files
├── docs/                   # Documentation sites
│   ├── ensnode.io/         # Main documentation (Astro/Starlight)
│   └── ensrainbow.io/      # ENSRainbow landing page
├── terraform/              # Infrastructure as code
├── biome.jsonc            # Linting/formatting configuration
├── pnpm-workspace.yaml    # Workspace and catalog configuration
└── vitest.config.ts       # Root test configuration
```

### Package Naming

- **Monorepo packages**: `@ensnode/*` (e.g., `@ensnode/ensnode-sdk`)
- **Published packages**: `@namehash/*` (e.g., `@namehash/ens-referrals`)

## Development Commands

### Monorepo-wide

```bash
# Install dependencies
pnpm install

# Lint all code (auto-fix)
pnpm lint

# Lint check only (CI)
pnpm lint:ci

# Run all tests
pnpm test

# Type check all packages
pnpm typecheck

# Build all Docker images
pnpm run docker:build:ensnode
```

### ENSIndexer (apps/ensindexer)

Primary blockchain indexer using Ponder.

```bash
cd apps/ensindexer

# Development mode (with UI disabled for performance)
pnpm dev

# Start production indexer
pnpm start

# Serve API only (requires existing database)
pnpm serve

# Database management
pnpm db

# Generate Ponder types
pnpm codegen

# Run tests
pnpm test
```

**Environment Setup:** Copy `apps/ensindexer/.env.local.example` to `apps/ensindexer/.env.local` and configure RPC URLs, database connection, and plugins.

### ENSAPI (apps/ensapi)

REST and GraphQL API layer on top of ENSIndexer.

```bash
cd apps/ensapi

# Development mode with hot reload
pnpm dev

# Start production server
pnpm start

# Run tests
pnpm test
```

**Environment Setup:** Copy `apps/ensapi/.env.local.example` to `apps/ensapi/.env.local` and configure database and ENSIndexer connection.

### ENSAdmin (apps/ensadmin)

Next.js dashboard for exploring ENS protocol data.

```bash
cd apps/ensadmin

# Development server
pnpm dev

# Production build
pnpm build

# Serve production build
pnpm start
```

### ENSRainbow (apps/ensrainbow)

Label hash recovery service.

```bash
cd apps/ensrainbow

# Development mode
pnpm dev

# Start production server
pnpm start
```

### Individual Package Tests

To run tests for a specific package:

```bash
cd packages/<package-name>
pnpm test
```

Or from the root with filtering:

```bash
pnpm test <test-file-pattern>
```

## Architecture

Detailed patterns are documented in `.claude/rules/` files (auto-loaded by path):
- `ponder-indexing.md` — plugin system, event handlers, codegen (`apps/ensindexer/**`)
- `api-patterns.md` — SWR cache, Hono factory, response codes, route handlers (`apps/ensapi/**`)
- `sdk-development.md` — serialization, internal module, builder pattern, package structure (`packages/**`)
- `ens-referrals.md` — v0/v1 stability rules, domain types hierarchy (`packages/ens-referrals/**`, ENSApi analytics)

### Apps Structure

- **ensindexer** - Ponder-based blockchain indexer. Event handlers in `apps/ensindexer/ponder/src/`.
- **ensapi** - API server using Hono and GraphQL Yoga. GraphQL schema built with Pothos.
- **ensadmin** - Next.js frontend for data visualization and exploration.
- **ensrainbow** - Standalone service for recovering ENS labels from their hashes.
- **fallback-ensapi** - Fallback API implementation.

### Packages Structure

- **@ensnode/datasources** - Catalog of contract addresses, ABIs, chain configs, and event filters.
- **@ensnode/ensnode-schema** - Drizzle schemas for Ponder indexing.
- **@ensnode/ensnode-sdk** - Core SDK with types, utilities, and client libraries.
- **@ensnode/ponder-sdk** - Utility library for interacting with Ponder apps and data.
- **@ensnode/ensnode-react** - React hooks and providers for ENSNode APIs.
- **@ensnode/ponder-subgraph** - Subgraph-compatible GraphQL API implementation.
- **@ensnode/ponder-metadata** - Metadata utilities for Ponder.
- **@ensnode/ensrainbow-sdk** - TypeScript client for ENSRainbow API.
- **@ensnode/ens-referrals** - ENS referral program logic.
- **@namehash/namehash-ui** - Shared UI components.
- **@ensnode/shared-configs** - Shared configuration files (tsconfig, biome, etc.).

### Key Architectural Patterns (summary)

- **Ponder Configuration Merging**: Multiple plugins contribute Ponder configs merged together. See `apps/ensindexer/src/lib/merge-ponder-configs.ts`.
- **Environment-Driven Configuration**: ENSIndexer config built from env vars validated with Zod. See `apps/ensindexer/src/config/`.
- **Serialization/Deserialization**: Strict pattern for API data transfer (domain types ↔ JSON-safe types). See `sdk-development.md`.
- **Internal Module Pattern**: Zod schemas isolated in `/internal` exports. See `sdk-development.md`.
- **Builder Pattern**: Domain objects created via `build*` functions using `satisfies`. See `sdk-development.md`.
- **SWR Cache**: Stale-While-Revalidate caching via `SWRCache` from `@ensnode/ensnode-sdk`. See `api-patterns.md`.
- **Hono Factory Pattern**: Type-safe middleware via `createFactory`. See `api-patterns.md`.
- **Response Code Pattern**: API responses as discriminated unions with response codes. See `api-patterns.md`.
- **Workspace Dependencies**: Packages use `workspace:*` protocol for monorepo dependencies.
- **Catalog Versioning**: Shared dependencies managed via pnpm catalog in `pnpm-workspace.yaml`.

## Testing

- Tests use **Vitest** across all packages.
- Root `vitest.config.ts` aggregates all workspace projects.
- Test files are colocated with source: `*.test.ts` alongside implementation files.
- Run with `LOG_LEVEL=silent` in CI to suppress logs.

### Testing Patterns

```typescript
// client.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock setup at top level
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ENSNodeClient", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("constructor and options", () => {
    it("should use default options when none provided", () => {
      const client = new ENSNodeClient();
      const options = client.getOptions();
      expect(options).toEqual({ url: getDefaultEnsNodeUrl() });
    });
  });

  describe("resolveRecords", () => {
    it("should handle address and text selections", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new ENSNodeClient();
      const response = await client.resolveRecords(name, selection);

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });
  });
});
```

### Testing Commands

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/ensnode-sdk && pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test <test-file-pattern>
```

## Docker Deployment

Each app has its own Dockerfile:
- `apps/ensindexer/Dockerfile`
- `apps/ensapi/Dockerfile`
- `apps/ensadmin/Dockerfile`
- `apps/ensrainbow/Dockerfile`

Use `docker-compose.yml` for local orchestration. Services:
- `ensindexer` - Requires PostgreSQL and ENSRainbow
- `ensapi` - Requires ENSIndexer and PostgreSQL
- `ensadmin` - Requires ENSAPI
- `ensrainbow` - Standalone service
- `postgres` - Database backend

## Coding Conventions

### TypeScript Style

```typescript
// ✅ Use explicit type annotations for function parameters and return types
async function resolveRecords(
  name: ResolveRecordsRequest["name"],
  selection: ResolveRecordsRequest["selection"],
  options?: Omit<ResolveRecordsRequest, "name" | "selection">,
): Promise<ResolveRecordsResponse> { ... }

// ✅ Use `satisfies` for type validation while preserving inference
const result = {
  referrer: normalizeAddress(referrer),
  totalReferrals,
  totalIncrementalDuration,
  totalRevenueContribution,
} satisfies ReferrerMetrics;

// ✅ Use const assertions for enum-like objects
export const AssetNamespaces = {
  ERC721: "erc721",
  ERC1155: "erc1155",
} as const;

export type AssetNamespace = (typeof AssetNamespaces)[keyof typeof AssetNamespaces];

// ✅ Prefer branded types and type aliases for domain concepts
export type ChainId = number;
export type UnixTimestamp = number;
export type Duration = number;
export type BlockNumber = number;
```

### Import Organization

Biome enforces a specific import order (see `biome.jsonc`):

```typescript
// 1. Package.json imports (if any)
import packageJson from "@/../package.json" with { type: "json" };

// 2. Config imports
import config from "@/config";

// 3. Node/Bun/URL modules
// (blank line)

// 4. External packages (except @ensnode/*)
import { serve } from "@hono/node-server";
import { z } from "zod/v4";

// 5. Monorepo packages (@ensnode/*)
import { SWRCache } from "@ensnode/ensnode-sdk";

// 6. Project-specific aliases (@/)
import { factory } from "@/lib/hono-factory";

// 7. Relative path imports
import type { ReferrerMetrics } from "./referrer-metrics";
```

### Formatting Rules

- **Indent**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Double quotes for strings
- **Semicolons**: Required
- **Linter**: Biome handles linting and formatting (not Prettier/ESLint)

### Naming Conventions

```typescript
// Types/Interfaces: PascalCase
interface ReferrerMetrics { ... }
type ChainId = number;

// Constants: SCREAMING_SNAKE_CASE or PascalCase for objects
export const DEFAULT_ENSNODE_API_URL = "https://api.alpha.ensnode.io";
export const RegistrarActionsFilterTypes = { ... } as const;

// Functions: camelCase, often prefixed with action verb
export function buildReferrerMetrics(...) { ... }
export function deserializeResponse(...) { ... }
export function serializeResponse(...) { ... }

// Files: kebab-case with descriptive suffixes
// - .ts (source)
// - .test.ts (tests)
// - .middleware.ts (Hono middleware)
// - .cache.ts (cache implementations)
```

## Important Conventions

### Code Style

- **Biome** handles linting and formatting (not Prettier/ESLint).
- Line width: 100 characters.
- Quote style: Double quotes.
- Import organization with specific group ordering (see `biome.jsonc`).
- Always run `pnpm lint` to auto-fix formatting issues.

### Node Version

- Requires Node.js >= 24.13.0 (see `package.json` engines field).

### Database

- PostgreSQL connection strings must use `postgresql://` or `postgres://` protocol.
- Schema management handled by Ponder migrations.
- Database schema name configurable via `DATABASE_SCHEMA` environment variable.

### ENS Normalization

- Uses `@adraffy/ens-normalize` package (version locked in catalog).
- Version is exposed in ENSIndexer version info API.

## Gotchas

- Run `pnpm codegen` after schema changes in `apps/ensindexer`
- `basenames`/`lineanames`/`threedns` plugins live under `apps/ensindexer/src/plugins/subgraph/plugins/`, not top-level
- v0 of `@namehash/ens-referrals` is **production** — do not break it; use `/v1` for new development
- Biome handles linting/formatting — never configure ESLint or Prettier

## Common Workflows

### Environment Variables

- Always provide `.env.local.example` files for required environment variables
- Validate environment variables with Zod schemas
- Use `pg-connection-string` for parsing PostgreSQL URLs
- RPC configs built dynamically from `RPC_URL_<CHAIN_ID>` pattern

### Adding a New Package

See `sdk-development.md` for full steps. In brief:
1. Create directory in `packages/`
2. Set up `package.json` with workspace dependencies (`workspace:*`)
3. Configure exports (main and `/internal` if needed)
4. Add `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`

### Adding a New API Endpoint

See `api-patterns.md` for full steps. In brief:
1. Define types + serialization in `packages/ensnode-sdk/src/api/`
2. Implement handler in `apps/ensapi/src/handlers/`
3. Wire up route in `apps/ensapi/src/index.ts`

### Adding a New Plugin

See `ponder-indexing.md` for full steps including directory nesting rules.

## Documentation

- Main docs: https://ensnode.io
- ENSIndexer: https://ensnode.io/ensindexer/
- ENSAdmin: https://ensnode.io/ensadmin/
- ENSRainbow: https://ensnode.io/ensrainbow/
- Contributing: https://ensnode.io/docs/contributing

## Important Files

### Configuration
- `biome.jsonc` - Linting/formatting rules
- `pnpm-workspace.yaml` - Workspace packages and version catalog
- `vitest.config.ts` - Root test configuration

### Key Source Files
- `packages/ensnode-sdk/src/client.ts` - Main SDK client
- `packages/ensnode-sdk/src/internal.ts` - Internal Zod schemas
- `packages/ens-referrals/src/referrer-metrics.ts` - Domain model example
- `apps/ensapi/src/index.ts` - API server entrypoint
- `apps/ensapi/src/lib/hono-factory.ts` - Typed Hono factory
- `apps/ensindexer/src/lib/merge-ponder-configs.ts` - Plugin config merging

### Environment Configuration
- `apps/ensindexer/.env.local.example` - ENSIndexer environment variables
- `apps/ensapi/.env.local.example` - ENSApi environment variables
- `apps/ensadmin/.env.local.example` - ENSAdmin environment variables
- `apps/ensrainbow/.env.local.example` - ENSRainbow environment variables

## Tips for AI Assistants

1. **Always check `internal.ts`** when working with Zod schemas - they're intentionally hidden from public API
2. **Follow the builder pattern** when creating domain objects - use `satisfies` for type safety
3. **Use `satisfies`** for type validation while preserving type inference
4. **Match import ordering** defined in `biome.jsonc` - Biome will auto-fix on save
5. **Check response code patterns** - APIs use discriminated unions, not exceptions
6. **Use SWRCache** for any data that benefits from stale-while-revalidate semantics
7. **Run `pnpm lint`** to auto-fix formatting and import ordering
8. **Check existing tests** for patterns when writing new tests
9. **Prefer explicit types** over `any` - the codebase is strictly typed
10. **Document invariants** in JSDoc comments using `@invariant` tags
11. **Serialize/deserialize** when crossing API boundaries (bigint → string, etc.)
12. **Use typed Hono factory** for middleware composition
13. **Colocate tests** with source files using `.test.ts` suffix
14. **Respect v0/v1 stability** in `@namehash/ens-referrals` - v0 must stay backward compatible, v1 can break during development

## Notes

- **Subgraph Compatibility**: When `subgraph` plugin is exclusively enabled, ENSNode has 100% data equivalency with the ENS Subgraph.
- **Multichain Support**: Multiple plugins can be enabled simultaneously to create a unified multichain namespace.
- **RPC Requirements**: Each indexed chain requires corresponding RPC URL configuration.
- **Label Recovery**: ENSRainbow is essential for recovering unknown labels from their hashes during indexing.
