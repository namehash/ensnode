# ENSNode

> a multichain ENS indexer, powered by Ponder

ENSNode is the new multichain indexer for ENS and ENSv2. It provides enhanced ENS indexing capabilities beyond the ENS Subgraph, including faster indexing and simpler deployments. Initial multichain capabilities include indexing mainnet, Basenames, and Linea, providing a unified multichain namespace in a subgraph-compatible GraphQL api. When indexing just mainnet, it has full data equivalency with the ENS Subgraph.

- 1:1 Subgraph equivalency of results for known queries
  - ✅ 100% data equivalency via [ens-subgraph-transition-tools](https://github.com/namehash/ens-subgraph-transition-tools)
  - ✅ 100% ensjs test suites passing via [ens-test-env](https://github.com/namehash/ens-test-env)
  - ✅ [use ENSNode with ENSjs](https://www.ensnode.io/ensnode/usage/with-ensjs/)
  - 🚧 100% ens-app-v3 test suites passing via [ens-test-env](https://github.com/namehash/ens-test-env)
  - see the [Subgraph-Compatibility Reference](https://www.ensnode.io/ensnode/reference/subgraph-compatibility/) for more info
- true multichain ENS namespace
  - flattened, unified, multichain and multiregistrar namespace via optional plugins
  - ✅ Mainnet ENS Names
  - ✅ Basenames (`.base.eth`)
  - ✅ Linea Names (`.linea.eth`)
- Rapid Indexing
  - ✅ Mainnet ETH backfill time **7 hours** on M1 Macbook, **13 hours** on standard VPS
- Own your ENSNode index
  - Run ENSNode in your own cloud for customized uptime guarantees and private queries
  - See the [ENSNode Deployment Guide](https://ensnode.io/ensnode/deploying/) for more info

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
