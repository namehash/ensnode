# ENSNode

ENSNode is a multichain indexer for ENS, powered by Ponder.

The ENSNode monorepo contains multiple modules in the following subdirectories:
- `apps`  executable applications.
- `packages` for libraries, both published and used here internally, can be embedded into your own apps.

The main module of this repository is the ENSNode app found in [`apps/ensnode`](apps/ensnode).

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

Go into the application root directory:
```
cd apps/ensnode
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

### Query index

The ENSNode exposes two GraphQL endpoints to query:
- `/` uses a Ponder-native GraphQL schema
- `/subgraph` uses a subgraph-compatible GraphQL schema

#### Examples

Fetching data about most recently-created domains while skipping some initial records.

<details>
  <summary>Ponder-native query</summary>

  ```gql
  {
    domains(
      orderBy: "createdAt"
      orderDirection: "desc"
      after: "eyJjcmVhdGVkQXQiOnsiX190eXBlIjoiYmlnaW50IiwidmFsdWUiOiIxNjM5ODk1NzYxIn0sImlkIjoiMHhkNTczOGJjNGMxYzdhZDYyYWM0N2IyMWNlYmU1ZGZjOWZkNjVkNTk4NTZmNmYyNDIxYjE5N2Q0ZjgxNmFkZTRjIn0"
      limit: 3
    ) {
      items {
        name
        expiryDate
      }
      pageInfo {
        endCursor
      }
      totalCount
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
              "name": "cdkey.eth",
              "expiryDate": "1963241281"
            },
            {
              "name": "threeion.eth",
              "expiryDate": "1710785665"
            },
            {
              "name": "humes.eth",
              "expiryDate": "1710785665"
            }
          ],
          "pageInfo": {
            "endCursor": "eyJjcmVhdGVkQXQiOnsiX190eXBlIjoiYmlnaW50IiwidmFsdWUiOiIxNjM5ODk1NzYxIn0sImlkIjoiMHgyZWFmNmQ1YjU1YjdhZWI0NmNiZmRiMjVkN2VjOGY4MWYxNDg2YmFmNWFiNjhkZTM5M2YzYTcyNjM1ZDdmN2FkIn0="
          },
          "totalCount": 982390
        }
      }
    }
    ```
  </details>
</details>

<details>
  <summary>Subgraph-native query</summary>

  ```gql
  {
    domains(orderBy: createdAt, orderDirection: desc, skip: 40, first: 3) {
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
            "name": "🐧🐧🐧🐧🐧🐧🐧🐧🐧.eth",
            "expiryDate": "1710785244"
          },
          {
            "name": "rebelteenapeclub.eth",
            "expiryDate": "1679228224"
          },
          {
            "name": "[b4201276b6f7ffe5a50b0c3c1406c21295ab9f553107ddc9c715be2f9a6f6e90].[e5e14487b78f85faa6e1808e89246cf57dd34831548ff2e6097380d98db2504a].[dec08c9dbbdd0890e300eb5062089b2d4b1c40e3673bbccb5423f7b37dcf9a9c]",
            "expiryDate": null
          }
        ]
      }
    }
    ```
  </details>
</details>
