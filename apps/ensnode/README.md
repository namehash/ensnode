# ENSNode

> a multichain ENS indexer, powered by Ponder

## Overview

## goals

> an optimized, multichain ens indexer that the community loves and integrates

- ease of deployment for indiviudals to run their own infra
- faster, more efficient, easier to use and deploy implementation
- v1 — **high confidence in subgraph equivalency**
  - 1:1 equivalency of results for queries via ensjs
    - 100% ensjs, ens-app-v3 test suites passing
    - should 'just work', following [this documentation](https://github.com/ensdomains/ensjs/blob/main/docs/basics/custom-subgraph-uris.md)
  - ensjs equivalency confirmed via [ens-subgraph-transition-tools](https://github.com/namehash/ens-subgraph-transition-tools)
- v2 — **optimized multichain indexer w/ unified namespace**
  - true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace
  - support key ens-app-v3 and wallet ENS funtions via optimized resolvers & PRs
  - high quality human-readable (healed) list of names by owner, necessary for many UX
  - (possible) continued backwards compatibility with subgraph
  - support indexing subset of data, i.e. only domains under parent node

## notes

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry

### `eth` plugin performance

estimated mainnet-only backfill time @ <=500rps = **~13 hours** on M1 Macbook (>10x speedup vs subgraph)

## ENSIP Ideas

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from
  - optional, in the popular case of L2-managed subnames
  - removes centralized dependency on the CCIP Gateway
  - flaky test experience with .cb.id name gateway
  - also helps indexer discovery

## Dockerfile

> Instructions for building the Docker image for ENSNode.

To build the Docker image, navigate to the top of the monorepo and run the following command:

```bash
docker build -f apps/ensnode/Dockerfile -t namehash/ensnode .
```

This command will use the Dockerfile located in the `apps/ensnode` directory to create the image.

### Important Note
The Dockerfile expects the build context to be at the top of the monorepo. This means that all the necessary files and directories it needs to access during the build process should be available from that location. If you run the build command from a different directory, the Dockerfile may not find the required files, leading to errors. Keeping the context at the top ensures everything is organized and accessible for a smooth build process.

### Team and Docker Image Repository
The team responsible for this repository is publishing its own Docker image under the following Docker image repository: [ENSNode image repository](https://github.com/namehash/ensnode/pkgs/container/ensnode%2Fensnode). This allows users to easily pull the pre-built image without needing to build it themselves.

### Running the Application
To run the application using Docker, you can use the following command:

```bash
docker run -p 42069:42069 namehash/ensnode
```

This command will start the container and map port `42069` from the container to your local machine, allowing you to access the application.

### Docker Compose
For a more convenient setup, you can also use Docker Compose. Refer to the Docker Compose usage instructions at the top of the monorepo for details on how to run the application with Docker Compose, which simplifies the process of managing multi-container applications.
