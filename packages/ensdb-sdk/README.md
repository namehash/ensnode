# ENSDb SDK

This package defines the database schema used by ENSDb.

It exposes two schema modules because `ENSIndexer` needs two different kinds of tables:

- ENSIndexer Schema for indexing onchain data
- ENSNode Schema for indexing offchain data

## ENSIndexer Schema

Source: `packages/ensdb-sdk/src/ensindexer`

This database schema is required by the Ponder app that powers `ENSIndexer`.

Ponder requires `ponder.schema.ts` to follow specific rules: `https://ponder.sh/docs/api-reference/ponder/schema#file-requirements`.

The most important rule here is that tables must be defined with `onchainTable()`, not with Drizzle's `pgSchema(schemaName).table()`.

Both APIs produce Drizzle table objects, but there is one important difference: `onchainTable()` does not hardcode the Postgres schema name up front. Ponder chooses the schema name dynamically from its configuration.

Ponder is also responsible for initializing and migrating the ENSIndexer Schema. It reads this schema through `apps/ensindexer/ponder/ponder.schema.ts`, which re-exports `packages/ensdb-sdk/src/ensindexer`.

### When it changes

Update files in `src/ensindexer`, then start `ENSIndexer`. Ponder handles the rest.

## ENSNode Schema

Source: `packages/ensdb-sdk/src/ensnode`

This schema is also required by `ENSIndexer`, but for offchain data rather than onchain data.

It uses Drizzle's Postgres schema APIs such as `pgSchema("ensnode").table()`. Unlike the ENSIndexer Schema, the database schema name is fixed up front as `ensnode`.

### When it changes

You must generate migration files:

```bash
pnpm -F @ensnode/ensdb-sdk drizzle-kit:generate
```

This updates `packages/ensdb-sdk/migrations`. `ENSIndexer` currently takes responsibility for applying those migrations and initializing the ENSNode Schema.

## Rule of thumb

- `onchainTable()` + schema name chosen by Ponder = ENSIndexer Schema
- `pgSchema().table()` + fixed schema name + generated migrations = ENSNode Schema

## Current transition

`packages/ensdb-sdk/src/ensindexer/index.ts` still re-exports `ensnode-metadata.schema.ts` as a temporary bridge until ENSNode Schema migrations are fully in place.
