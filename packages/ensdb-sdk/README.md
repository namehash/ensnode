# ENSDb SDK

This package is a utility library for interacting with ENSDb.

## Database schema definitions

### ENSIndexer Schema

This schema consist of database object definitions exported from `src/ensindexer` module.
Defining database objects is done by using functionality from `ponder` package.

#### Applying schema definition updates

Updating database object definitions in ENSIndexer Schema _does not_ require any extra steps. ENSIndexer app is built on top of Ponder app. The Ponder app runtime takes care of generating migrations and having them executed during application runtime. In other words, ENSIndexer Schema in ENSDb gets auto-updated when ENSIndexer app starts.

### ENSNode Schema

This schema consist of database object definitions exported from `src/ensnode` module.
Defining database objects is done by using functionality from `drizzle-orm` package.

#### Applying schema definition updates

Updating database object definitions in ENSNode Schema _does_ require an extra step: generating SQL queries to be executed for ENSNode Schema in ENSDb. 

Generating SQL queries can be done with the following CLI command:
```
pnpm -F @ensnode/ensdb-sdk drizzle-kit:generate
```

This command will update files inside the `migrations` directory, including SQL files.
The `migrations` directory can be later reference by application runtime (i.e. ENSIndexer app) in order to execute pending SQL migrations for ENSNode Schema in ENSDb.
