# ENSNode

ENSNode is a multichain indexer for ENS, powered by Ponder.

The ENSNode monorepo contains multiple modules in the following subdirectories:

- [`apps`](apps) executable applications.
- [`packages`](packages) for libraries that can be embedded into apps.

## Applications

### [`apps/ensnode`](apps/ensnode)

The main ENSNode indexer application enabling multichain indexing for ENS.

### [`apps/ensrainbow`](apps/ensrainbow)

A sidecar service for healing ENS labels. It provides a simple API to recover labels from their hashes. This optimizes a number of ENS use cases, including indexing of ENS data. See the [ENSRainbow documentation](apps/ensrainbow/README.md) for more details.

## Documentation

### [`docs/ensnode`](docs/ensnode)

View the [ENSNode docs](https://www.ensnode.io).

### [`docs/ensrainbow`](docs/ensrainbow)

View the [ENSRainbow docs](https://www.ensrainbow.io).

## Libraries

### [`packages/ens-deployments`](packages/ens-deployments)

Convenient catalog of ENS deployments including chain, contract addresses, start blocks, and event filters.

### [`packages/ensrainbow-sdk`](packages/ensrainbow-sdk)

TypeScript library for interacting with the [ENSRainbow API](apps/ensrainbow).

### [`packages/ensnode-utils`](packages/ensnode-utils)

Common utilities used across ENSNode applications

### [`packages/ponder-schema`](packages/ponder-schema)

Shared Ponder schema definitions

### [`packages/ponder-subgraph-api`](packages/ponder-subgraph-api)

Subgraph API compatibility layer

### [`packages/shared-configs`](packages/shared-configs)

Shared configuration files

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
cd apps/ensnode
```

Configure for your local application environment:

```
cp .env.local.example .env.local
```

then review the docs inside your .env.local file for configuration instructions.

- `ENS_DEPLOYMENT_CHAIN` — one of `mainnet`, `sepolia`, `holesky`, or `ens-test-env` (optional, default: `mainnet`)
  - defines which ENS Deployment to index from
- `ACTIVE_PLUGINS` — a comma-separated list of plugin names. Available plugin names are: `eth`, `base`, `linea`. The activated plugins list determines which contracts and chains are indexed. Any permutation of plugins might be activated (except no plugins activated) for single-chain or multi-chain indexing.
- `RPC_URL_*` — optional, but you can use private ones to speed the syncing process up
- `RPC_REQUEST_RATE_LIMIT_*` — optional, you can change the rate limit for RPC requests per second.
- `DATABASE_SCHEMA` is arbitrary, with the limitations mentioned in the linked documentation
- `DATABASE_URL` is your postgres database connection string
- `ENSRAINBOW_URL` is the URL pointing to your deployment of [ENSRainbow](apps/ensrainbow/) for healing unknown labels

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
  domains(orderBy: "createdAt", orderDirection: "desc", limit: 3) {
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

## Using Docker Compose

Docker Compose is a tool that allows you to define and run multi-container Docker applications. In this monorepo, we use Docker Compose to set up the ENSNode application along with its dependencies: a PostgreSQL database and ENSRainbow.

### Prerequisites

Before you can use Docker Compose, ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/get-started) - This is the platform that allows you to run containers.
- [Docker Compose](https://docs.docker.com/compose/install/) - This is a tool for defining and running multi-container Docker applications.

### Setting Up the Environment

1. **Clone the Repository**: If you haven't already, clone the ENSNode repository to your local machine:

   ```bash
   git clone git@github.com:namehash/ensnode.git
   cd ensnode
   ```

2. **Prepare the Environment**: Ensure you have a `.env.local` file in the `apps/ensnode` directory. This file contains environment variables needed for the application. You can create it by copying the example file:

   ```bash
   cp apps/ensnode/.env.local.example apps/ensnode/.env.local
   ```

   Then, edit the `.env.local` file to configure your local settings as needed.

### Running the Applications

To start the ENSNode application and its dependencies using Docker Compose, follow these steps:

1. **Open a Terminal**: Navigate to the root directory of the ENSNode monorepo where the `docker-compose.yml` file is located.

2. **Run Docker Compose**: Execute the following command to start the application:

   ```bash
   docker-compose up
   ```

   This command will:

   - Build the Docker images for the ENSNode and ENSRainbow applications.
   - Start the PostgreSQL database container.
   - Start the ENSNode application, which will be accessible on port `42069`.
   - Start the ENSRainbow application, which will be accessible on port `3223`.

3. **Access the Applications**: Once the containers are running, you can access the applications in your web browser:
   - **ENSNode**: Open [http://localhost:42069](http://localhost:42069) to access the ENSNode indexer.
   - **ENSRainbow**: Open [http://localhost:3223](http://localhost:3223) to access the ENSRainbow service.

### Expected Outcome

After running `docker-compose up`, you should see logs in your terminal indicating that the services are starting. Once everything is up and running, you can interact with the ENSNode application through the hostnames referenced above.

### Stopping the Applications

To stop the running applications, you can press `Ctrl + C` in the terminal where Docker Compose is running. If you want to remove the containers and networks created by Docker Compose, you can run:

```bash
docker-compose down
```

This command will stop and remove all containers defined in the `docker-compose.yml` file.

### Summary

Using Docker Compose simplifies the process of setting up and running ENSNode along with its dependencies. By following the steps above, you can quickly get the application running on your local machine without needing to manually configure each component.
