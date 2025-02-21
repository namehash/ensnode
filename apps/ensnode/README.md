# ENSNode

> a multichain ENS indexer, powered by Ponder

## Overview

ENSNode is the new multichain indexer for ENS and ENSv2. It provides enhanced ENS indexing capabilities beyond the ENS Subgraph, including faster indexing and simpler deployments. Initial multichain capabilities include indexing mainnet, Basenames, and Linea, providing a more unified multichain namespace in a subgraph-compatible GraphQL api. When indexing just mainnet, it has full data equivalency with the ENS Subgraph.

- 1:1 Subgraph equivalency of results for most queries
  - 100% ensjs, ens-app-v3 test suites passing, via [ens-subgraph-transition-tools](https://github.com/namehash/ens-subgraph-transition-tools)
  - [use ENSNode with ensjs](https://www.ensnode.io/guides/using-ensnode-with-ensjs/)
  - see the [Subgraph-Compatibility Reference](https://www.ensnode.io/reference/subgraph-compatibility/) for more info
- true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace via optional plugins

### `eth` plugin performance

Mainnet-only backfill time @ 500rps = **11.5-15 hours** on M1 Macbook (>10x speedup vs subgraph)

## Dockerfile

> Instructions for building the Docker image for ENSNode.

To build the Docker image, navigate to the top of the monorepo and run the following command:

```bash
docker build -f apps/ensnode/Dockerfile -t namehash/ensnode .
```

This command will use the Dockerfile located in the `apps/ensnode` directory to create the image.

### Important Note
The Dockerfile expects the build context to be at the top of the monorepo. This means that all the necessary files and directories it needs to access during the build process should be available from that location. If you run the build command from a different directory, the Dockerfile may not find the required files, leading to errors. Keeping the context at the top ensures everything is organized and accessible for a smooth build process.

### Public Docker Image Repository
NameHash Labs publishes prebuilt ENSNode Docker images for the community under a [Docker image repository](https://github.com/namehash/ensnode/pkgs/container/ensnode%2Fensnode). You can use this to easily pull a prebuilt image without needing to build it yourself.

### Running the Application
After building the Docker image, you can run the application with the following command:

```bash
docker run -p 42069:42069 namehash/ensnode
```

This command will start the container for ENSNode and map port `42069` from the container to your local machine, allowing you to access ENSNode.


Make sure to set any necessary environment variables when running the application. You can find these variables in the [`.env.local.example`](apps/ensnode/.env.local.example) file. Use the `-e` flag in the `docker run` command to set them, like so:

```bash
docker run -p 42069:42069 \
  -e RPC_URL_1=https://eth.drpc.org \
  -e RPC_REQUEST_RATE_LIMIT_1=50 \
  -e DATABASE_URL=postgresql://dbuser:abcd1234@localhost:5432/my_database \
  namehash/ensnode
```

Additionally, ensure that you have a separate database instance set up for this application to work correctly.

### Docker Compose
For a more convenient setup, you can also use Docker Compose [`docker-compose.yml`](../../docker-compose.yml). Refer to the Docker Compose usage instructions at the top of the monorepo for details on how to run the application with Docker Compose, which simplifies the process of managing multi-container applications [`README.md`](../../README.md#Using-Docker-Compose).
