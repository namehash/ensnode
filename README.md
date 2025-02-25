# ENSNode

ENSNode is a multichain indexer for ENS, powered by Ponder.

## Documentation

Documentation for the ENSNode suite of apps is available at [ensnode.io](https://ensnode.io).

## Contributions

We welcome community contributions and feedback—please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## Repo Overview

The ENSNode monorepo contains multiple modules in the following subdirectories:

- [`apps`](apps) executable applications.
- [`packages`](packages) for libraries that can be embedded into apps.
- [`docs`](docs) documentation sites.

### [`apps/ensnode`](apps/ensnode)

The main ENSNode indexer application enabling multichain indexing for ENS.

### [`apps/ensrainbow`](apps/ensrainbow)

A sidecar service for healing ENS labels. It provides a simple API to recover labels from their hashes. This optimizes a number of ENS use cases, including indexing of ENS data. See the [ENSRainbow documentation](apps/ensrainbow/README.md) for more details.

## Packages

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

## Docs

### [`docs/ensnode`](docs/ensnode.io/)

Astro/Starlight documentation app for ENSNode and ENSRainbow.

### [`docs/ensrainbow`](docs/ensrainbow.io/)

Landing page for ENSRainbow.
