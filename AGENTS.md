# ENSNode - AI Agent Guide

This guide helps AI agents understand and work effectively with the ENSNode codebase.

## Project Overview

ENSNode is a modern, multichain indexer for the Ethereum Name Service (ENS) protocol. It provides:
- **ENSIndexer**: Ponder-powered multichain ENS indexer
- **ENSAPI**: GraphQL + REST API for ENS data
- **ENSRainbow**: Label healing service (rainbow tables for labelHash recovery)
- **ENSAdmin**: Dashboard UI for exploring ENS data

## Tech Stack

- **Runtime**: Node.js 24.13.0+ (ES Modules)
- **Package Manager**: pnpm 10.28.0
- **Language**: TypeScript 5.7.3
- **Monorepo**: pnpm workspaces + Changesets

### Core Dependencies
- **ENSIndexer**: Ponder 0.16.2 (EVM indexing framework)
- **ENSAPI**: Hono 4.11.7 + Pothos GraphQL + GraphQL Yoga
- **ENSRainbow**: Hono + LevelDB
- **ENSAdmin**: Next.js 16.1.5 + React 19 + Tailwind CSS 4
- **Web3**: viem 2.22.13, @ensdomains/ensjs 4.0.2
- **Database**: Drizzle ORM 0.41.0 + PostgreSQL 17
- **Validation**: Zod 4.3.6

### Development Tools
- **Lint/Format**: Biome 2.3.1 (replaces ESLint + Prettier)
- **Testing**: Vitest 4.0.2
- **Build**: tsup
- **CI/CD**: GitHub Actions (Blacksmith runners)
- **Containers**: Docker + Docker Compose

## Monorepo Structure

```
/Users/tko/dev/github/namehash/ensnode/
├── apps/                      # Executable applications
│   ├── ensindexer/           # Ponder-powered ENS indexer
│   ├── ensapi/               # GraphQL + REST API server
│   ├── ensrainbow/           # Label healing service
│   ├── ensadmin/             # Next.js dashboard UI
│   └── fallback-ensapi/      # AWS Lambda fallback
├── packages/                  # Shared libraries
│   ├── ensnode-sdk/          # SDK for ENSNode
│   ├── ensnode-react/        # React hooks
│   ├── ensnode-schema/       # Drizzle schemas
│   ├── ensrainbow-sdk/       # SDK for ENSRainbow
│   ├── datasources/          # Contract configs
│   ├── ponder-subgraph/      # Subgraph-compatible GraphQL
│   ├── ponder-sdk/           # Ponder utilities
│   ├── ponder-metadata/      # Ponder metadata helpers
│   ├── namehash-ui/          # Shared UI components
│   └── shared-configs/       # Internal configs
├── docs/                      # Documentation sites (Astro/Starlight)
├── terraform/                 # AWS + Render infrastructure
└── patches/                   # pnpm patches
```

## Essential Commands

### Root Level

```bash
# Install dependencies
pnpm install

# Lint and format (write mode)
pnpm lint

# Lint for CI (check only, no write)
pnpm lint:ci

# Run all tests
pnpm test

# TypeScript type checking
pnpm typecheck

# Build all publishable packages
pnpm packages:prepublish

# Docker builds
pnpm docker:build:ensnode      # Build all images
pnpm docker:build:ensindexer  # Build specific app
pnpm docker:build:ensapi
pnpm docker:build:ensrainbow
pnpm docker:build:ensadmin

# Changesets (versioning)
pnpm changeset                 # Create changeset
pnpm changeset:next            # Snapshot version
pnpm changeset-publish         # Publish to NPM
```

### App-Specific Commands

**ENSIndexer** (`apps/ensindexer/`):
```bash
pnpm dev      # Run Ponder in dev mode (no UI)
pnpm start    # Production server
pnpm serve    # Serve Ponder API
pnpm db       # Database commands
pnpm codegen  # Generate types
```

**ENSRainbow** (`apps/ensrainbow/`):
```bash
pnpm serve         # Start API server
pnpm ingest        # Ingest label data
pnpm validate      # Validate data integrity
pnpm purge         # Purge data
pnpm get-legacy-data  # Download rainbow tables
```

**ENSAdmin** (`apps/ensadmin/`):
```bash
pnpm dev    # Next.js dev server (port 4173)
pnpm build  # Static export build
pnpm start  # Serve static export
```

## Code Style & Conventions

### Biome Configuration
- **Line width**: 100 characters
- **Indent**: 2 spaces
- **Quotes**: Double
- **Formatter**: Enabled for JS/TS/CSS

### Import Organization
Biome organizes imports in this order:
1. `package.json` imports
2. `@/config` imports
3. URLs & native modules (`:URL:`, `:BUN:`, `:NODE:`)
4. External packages (not `@ensnode/**`)
5. Monorepo packages (`@ensnode/**`)
6. Project aliases (`:ALIAS:`)
7. Relative paths (`:PATH:`)

### TypeScript
- All packages use ES Modules (`"type": "module"`)
- Strict TypeScript configuration
- Prefer explicit types over implicit

### Code Patterns

**Workspace Dependencies**:
```json
"@ensnode/ensnode-sdk": "workspace:*"
```

**Catalog Dependencies** (defined in `pnpm-workspace.yaml`):
```json
"viem": "catalog:"
```

**Package Exports** (for publishable packages):
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./internal": "./src/internal.ts"
  },
  "publishConfig": {
    "exports": {
      ".": {
        "import": {
          "types": "./dist/index.d.ts",
          "default": "./dist/index.js"
        }
      }
    }
  }
}
```

## Testing

- **Framework**: Vitest 4.0.2
- **Config**: `vitest.config.ts` at root with project mode
- **Pattern**: `apps/*/vitest.config.ts`, `packages/*/vitest.config.ts`
- **Environment**: Node.js (default), jsdom for DOM tests
- **Log Level**: `LOG_LEVEL=silent` in test environment

### Test File Patterns
- Unit tests: `*.test.ts`
- Test utilities can use non-null assertions (`!`)

### Running Tests
```bash
# All tests
pnpm test

# Specific app/package
pnpm --filter ensindexer test
```

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

1. **test_ci.yml**: Main CI pipeline
   - Dependency audit (`pnpm audit`)
   - Package builds (`pnpm packages:prepublish`)
   - Static analysis (Biome + TypeScript + Terraform fmt)
   - Unit tests
   - Runtime integrity checks (ENSIndexer healthcheck)

2. **release.yml**: Production releases
3. **release_snapshot.yml**: Snapshot releases
4. **release_preview.yml**: Preview releases
5. **deploy_ensnode_*.yml**: Deployment workflows

### CI Environment
- **Runner**: Blacksmith 4vCPU Ubuntu 22.04
- **Node**: 24.13.0 (via `.nvmrc`)
- **Postgres**: 17 (for integration tests)

## Docker Development

Full local stack via Docker Compose:

```bash
# Start all services
docker-compose up

# Services:
# - ensindexer: http://localhost:42069
# - ensapi: http://localhost:4334
# - ensrainbow: http://localhost:3223
# - ensadmin: http://localhost:4173
# - postgres: localhost:5432
```

### Required Environment Files
- `apps/ensindexer/.env.local` (required)
- `apps/ensapi/.env.local` (required)
- `apps/ensrainbow/.env.local` (optional)
- `apps/ensadmin/.env.local` (optional)

Copy from `.env.local.example` files in each app directory.

## Common Development Workflows

### Adding a New Package

1. Create directory in `packages/<name>/`
2. Add `package.json` with:
   - `"type": "module"`
   - `"@ensnode/shared-configs": "workspace:*"` as devDependency
   - Scripts: `lint`, `lint:ci`, `test`, `typecheck`
3. Add `tsconfig.json` extending shared config
4. Add `vitest.config.ts` if tests needed
5. Update `pnpm-workspace.yaml` if new catalog entries needed

### Adding a New App

1. Create directory in `apps/<name>/`
2. Follow same package.json structure as existing apps
3. Add Dockerfile if deployable service
4. Add to docker-compose.yml if part of local stack
5. Add to root package.json docker scripts

### Making Changes

1. **Lint before commit**: `pnpm lint`
2. **Type check**: `pnpm typecheck`
3. **Run tests**: `pnpm test`
4. **Create changeset** (if affecting public packages): `pnpm changeset`

### Versioning & Publishing

Uses Changesets for versioning:
- Patch: Bug fixes
- Minor: New features
- Major: Breaking changes

Publish flow:
1. PR with changeset merged to main
2. `pnpm changeset-publish` creates version PR
3. Version PR merged
4. Packages published to NPM
5. Docker images built and pushed to GHCR

## Key Architectural Decisions

### ENSIndexer
- Built on Ponder framework
- Multichain support via plugins (mainnet, basenames, lineanames, 3dns)
- Subgraph-compatible GraphQL via ponder-subgraph package
- Protocol acceleration for optimized resolution

### ENSAPI
- Hono web framework for performance
- GraphQL via Pothos (code-first schema) + Yoga
- REST endpoints via Hono OpenAPI
- OpenTelemetry for observability

### ENSRainbow
- LevelDB for label storage
- Serves labelHash → label lookups
- Ingests from legacy rainbow tables

### Database
- PostgreSQL 17 via Drizzle ORM
- Schema definitions in `packages/ensnode-schema/`
- Connection string via `DATABASE_URL` env var

## Environment Variables

### ENSIndexer
- `DATABASE_URL`: PostgreSQL connection
- `DATABASE_SCHEMA`: Schema name (default: public)
- `ENSRAINBOW_URL`: ENSRainbow service URL
- `ENSINDEXER_URL`: Self-reference URL
- `PLUGINS`: Comma-separated plugin list
- `NAMESPACE`: Chain namespace (mainnet, etc.)
- `ALCHEMY_API_KEY`, `QUICKNODE_API_KEY`: RPC providers

### ENSAPI
- `DATABASE_URL`: PostgreSQL connection
- `ENSINDEXER_URL`: ENSIndexer service URL

### ENSRainbow
- `PORT`: Server port (default: 3223)
- `DATA_DIR`: Data directory path

### ENSAdmin
- `ENSADMIN_PUBLIC_URL`: Public URL for the admin UI
- `NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY`: ENSAPI URL

## Troubleshooting

### Common Issues

**Module resolution errors**:
- Ensure using pnpm (not npm/yarn)
- Run `pnpm install` from root

**Type errors**:
- Run `pnpm typecheck` to see all errors
- Check that `catalog:` dependencies are in `pnpm-workspace.yaml`

**Test failures**:
- Check `LOG_LEVEL` is set correctly
- For integration tests, ensure PostgreSQL is available

**Docker issues**:
- Ensure `.env.local` files are created from examples
- Check that ports are not already in use

## Resources

- **Documentation**: https://ensnode.io
- **Telegram**: https://t.me/ensnode
- **Context7**: https://context7.com/namehash/ensnode
- **Contributing**: https://ensnode.io/docs/contributing

## Repository Links

- **GitHub**: https://github.com/namehash/ensnode
- **Issues**: https://github.com/namehash/ensnode/issues
- **License**: MIT
