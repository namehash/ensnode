# ENSNode

ENSNode is a multichain indexer for ENS, powered by Ponder.

The ENSNode monorepo contains multiple modules in the following subdirectories:
- [`apps`](apps)  executable applications.
- [`packages`](packages) for libraries that can be embedded into apps.

The main module of this repository is the evm-indexer app found in [`apps/emv-indexer`](apps/evm-indexer).

## Quick start

### Prerequisites

- [Git](https://git-scm.com/)
- [Postgres](https://www.postgresql.org/)
  - Minimal supported version: `>=14`
- [Node.js](https://nodejs.org/)
  - It's recommended you install Node.js through [nvm](https://github.com/nvm-sh/nvm) (see link for installation instructions).
  - To ensure you're running the expected version of Node.js run `nvm install` in the root of the repository (after you clone it).
  - Node.js will automatically install `corepack`. You should also ensure Corepack is enabled by running `corepack enable`.
- [pnpm](https://pnpm.io/)
  - Run `npm install -g pnpm` or see [other installation options](https://pnpm.io/installation).
  - To ensure you're running the expected version of pnpm run `corepack use pnpm` in the root of the repository (after you clone it).

### Run the indexer

#### Prepare workspace environment
Clone this repository:
```
git clone git@github.com:namehash/ensnode.git
cd ensnode
```

Install workspace dependencies:
```
pnpm install
```

#### Prepare application environment

Go into the main ENSNode application root directory:
```
cd apps/evm-indexer
```

Configure for your local application environment:
```
cp .env.local.example .env.local
```
then review the docs inside your .env.local file for configuration instructions.

- `ACTIVE_PLUGINS` — a comma-separated list of plugin names. Available plugin names are: `eth`, `base.eth`, `linea.eth`. The activated plugins list determines which contracts and chains are indexed. Any permutation of plugins might be activated (except no plugins activated) for single-chain or multi-chain indexing.
- `RPC_URL_*` — optional, but you can use private ones to speed the syncing process up
- `RPC_REQUEST_RATE_LIMIT_*` — optional, you can change the rate limit for RPC requests per second.
- `DATABASE_SCHEMA` is arbitrary, with the limitations mentioned in the linked documentation
- `DATABASE_URL` is your postgres database connection string

Once your `.env.local` is configured, launch the indexer by running:
- `pnpm ponder dev` for development mode,
- `pnpm ponder start` for production mode.

To learn more about those commands, go to https://ponder.sh/docs/api-reference/ponder-cli#dev

### Query indexed data

ENSNode exposes two GraphQL endpoints to query:
- `/` uses a Ponder-native GraphQL schema
- `/subgraph` uses a subgraph-compatible GraphQL schema

#### Examples

Fetch data about the three most recently-created domains.

<details>
  <summary>Ponder-native query</summary>

  ```gql
  {
    domains(
      orderBy: "createdAt"
      orderDirection: "desc"
      limit: 3
    ) {
      items {
        name
        expiryDate
      }
    }
  }
  ```

  <details>
    <summary>Ponder-native response</summary>

    ```
    {
      "data": {
        "domains": {
          "items": [
            {
              "name": "ensanguo.eth",
              "expiryDate": "1758170255"
            },
            {
              "name": "fiffer.eth",
              "expiryDate": "2041994243"
            },
            {
              "name": "rifaisicilia.eth",
              "expiryDate": "1758170039"
            }
          ]
      }
    }
    ```
  </details>
</details>

<details>
  <summary>Subgraph-compatible query</summary>

  ```gql
  {
    domains(orderBy: createdAt, orderDirection: desc, first: 3) {
        name
        expiryDate
    }
  }
  ```

  <details>
    <summary>Subgraph-native response</summary>

    ```
    {
      "data": {
        "domains": [
          {
            "name": "ensanguo.eth",
            "expiryDate": "1758170255"
          },
          {
            "name": "fiffer.eth",
            "expiryDate": "2041994243"
          },
          {
            "name": "rifaisicilia.eth",
            "expiryDate": "1758170039"
          }
        ]
      }
    }
    ```
  </details>
</details>
