# ENSDb SDK

This package is a utility library for interacting with ENSDb.

## Database schema definitions

### ENSIndexer Schema

This schema consists of database object definitions exported from the `src/ensindexer` module.
Defining database objects is done by using functionality from `ponder` package.

#### Applying schema definition updates

Updating database object definitions in the ENSIndexer Schema _does not_ require manual database migrations. The ENSIndexer app delegates to its imported Ponder package to execute database migrations on an ENSIndexer Schema. In other words, each ENSIndexer Schema in ENSDb is automatically migrated by Ponder when ENSIndexer starts.

### ENSNode Schema

This schema consists of database object definitions exported from the `src/ensnode` module.
Defining database objects is done by using functionality from `drizzle-orm` package.

#### Applying schema definition updates

Updating database object definitions in ENSNode Schema _does_ require an extra step: generating SQL queries to be executed for ENSNode Schema in ENSDb. 

Generating SQL queries can be done with the following CLI command:
```
pnpm -F @ensnode/ensdb-sdk drizzle-kit:generate
```

This command will update files inside the `migrations` directory, including SQL files.
The `migrations` directory can later be referenced by the application runtime (i.e. ENSIndexer app) in order to execute pending SQL migrations for ENSNode Schema in ENSDb.
