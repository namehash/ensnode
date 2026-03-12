# ENSDb Schemas

Package defining database schemas used in ENSDb.

## Ponder Schema

- Owned by Ponder app.
- Shared across ENSIndexer instances.
- Includes responses to RPC requests made by cached public clients.
- Usually large in size, depending on selected ENS Namespace.
- Takes a long time to build.
- Backups highly recommended for sharing RPC cache across different ENSNode environments.
  - For example, pulling production backup into local environment in order to test production workflows in isolation.

## ENSIndexer Schema

- Owned by an ENSIndexer instance and also influenced by Ponder implementation details, as ENSIndexer is a Ponder app.
- Isolated for specific ENSIndexer instance.
- Includes indexed data based on event handlers logic from active ENSIndexer plugins.
- May be large in size, depending on selected ENS Namespace and active plugins.
- May take a long time to build. Must be re-built from scratch in case of indexing logic changes (i.e. event handler code change, active plugins change).

## ENSNode Schema

- Owned by ENSNode services.
- Includes metadata describing configuration and state of various ENSNode services.
- Tiny in size.
- Takes virtually no time to be built.
