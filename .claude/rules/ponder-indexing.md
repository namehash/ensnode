---
paths:
  - "apps/ensindexer/**"
---

# Ponder Indexing Rules

Applies when working in `apps/ensindexer/`.

## Plugin System

ENSIndexer uses a **plugin architecture** to support different ENS namespaces and indexing strategies. Each plugin bundles:
- Ponder configuration (contracts, event handlers, networks)
- Database schema extensions
- API handlers

**Available Plugins** (defined in `PluginName` enum in `packages/ensnode-sdk/src/ensindexer/config/types.ts`):
- `subgraph` - ENS Subgraph compatible indexing (mainnet .eth)
- `basenames` - Basenames on Base (.base.eth)
- `lineanames` - Lineanames on Linea (.linea.eth)
- `threedns` - 3DNS support (.box, .xyz, etc.)
- `protocol-acceleration` - Advanced protocol features
- `registrars` - Registrar-specific indexing
- `tokenscope` - Token-based scoping
- `ensv2` - ENSv2/Namechain support

Plugins are configured via the `PLUGINS` environment variable as a comma-separated list (e.g., `PLUGINS=subgraph,basenames,ensv2`).

### Plugin Directory Layout

**Standalone plugins** (top-level):
```
apps/ensindexer/src/plugins/
├── ensv2/
├── protocol-acceleration/
├── registrars/
└── tokenscope/
```

**Subgraph-schema-sharing plugins** (nested under subgraph):
```
apps/ensindexer/src/plugins/subgraph/plugins/
├── basenames/
├── lineanames/
└── threedns/
```

When creating a new plugin, determine whether it shares the subgraph schema. If yes, nest it under `subgraph/plugins/`; otherwise create it top-level.

## Key Patterns

### Ponder Configuration Merging

Multiple plugins contribute Ponder configs that are merged together. See `apps/ensindexer/src/lib/merge-ponder-configs.ts`.

### Environment-Driven Configuration

ENSIndexer configuration is built from environment variables validated with Zod schemas. See `apps/ensindexer/src/config/`.

RPC configs are built dynamically from `RPC_URL_<CHAIN_ID>` pattern.

## Adding a New Plugin

1. Determine nesting: standalone → `apps/ensindexer/src/plugins/<name>/`; subgraph-sharing → `apps/ensindexer/src/plugins/subgraph/plugins/<name>/`
2. Implement `plugin.ts` with `createPonderConfig`, schema, and handlers
3. Add to `ALL_PLUGINS` array in `apps/ensindexer/src/plugins/index.ts`
4. Add plugin name to `PluginName` enum in `packages/ensnode-sdk/src/ensindexer/config/types.ts`
5. Update environment validation in `apps/ensindexer/src/config/`

## Working with Ponder Event Handlers

- Handlers are registered in plugin directories under `src/` (e.g., `apps/ensindexer/src/plugins/subgraph/plugins/subgraph/src/`)
- Event handlers receive strongly-typed events based on Ponder config
- **Always run `pnpm codegen` after schema changes** to regenerate Ponder types
