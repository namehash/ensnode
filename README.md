<!-- VERTICAL WHITESPACE -->

<br>

<!-- BANNER IMAGE -->

<p align="center">
  <a href="https://ensnode.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/ensnode-banner-dark.svg">
      <img alt="ENSNode" src=".github/assets/ensnode-banner-light.svg" width="auto" height="80">
    </picture>
  </a>
</p>

<!-- VERTICAL WHITESPACE -->

<br>

# ENSNode

<a href="https://ensnode.io" target="_blank">ENSNode</a> is the new multichain indexer for ENS, including [ENSv2](https://roadmap.ens.domains/roadmap/).

Full Documentation ➡︎ <a href="https://ensnode.io" target="_blank">ensnode.io</a>

[Join us on Telegram](https://t.me/ensnode) to get support, share ideas, and discuss the future of ENSNode.

## The future of ENS indexing

ENSNode provides enhanced ENS indexing capabilities beyond the ENS Subgraph, including faster indexing and simpler self-hosted deployments. Initial multichain capabilities include indexing mainnet, Basenames, Lineanames, 3DNS, and more, providing a unified multichain namespace via a subgraph-compatible GraphQL API. When exclusively activating our subgraph plugin, ENSNode has full data equivalency with the ENS Subgraph.

- Multichain ENS Namespace
  - flattened, unified, multichain and multiregistrar namespace via optional plugins
  - ✅ All names added to the ENS Registry and the ENS NameWrapper
    - ✅ All direct subnames of .eth
  - ✅ [Basenames](https://www.base.org/names) (`.base.eth`)
  - ✅ [Lineanames](https://names.linea.build/) (`.linea.eth`)
  - ✅ [3DNS](https://3dns.box) Support (`.box`, `.xyz`, +more)
  - 🚧 Offchain Names
    - `.cb.id`, `.uni.id`, + more
    - [NameStone](https://namestone.com/) Names
    - [NameSpace](https://namespace.ninja/) Names
    - [Justaname](https://www.justaname.id/) Names
  - 🚧 + more
- Built on [Ponder](https://ponder.sh)
  - ✅ Rapid Indexing & Backfill
    - 10x faster than ENS Subgraph
    - Mainnet Cached Backfill: **4.5 hours** on M1 Macbook Pro
  - ✅ More efficient than ENS Subgraph
    - 35x less disk space and 35% fewer RPC credits [[source]](https://ponder.sh/docs/why-ponder)
  - ✅ End-to-end type safety
  - ✅ Automatically reconciles chain reorganizations
  - ✅ Deploy anywhere with Node.js & Docker
- Designed for web developers
  - ✅ [use ENSNode with ENSjs](https://ensnode.io/docs/usage/with-ensjs/)
  - ✅ [GraphQL APIs](https://ensnode.io/docs/usage/api/)
  - ✅ Custom APIs for your app
- [1:1 Subgraph Compatibility](https://ensnode.io/docs/concepts/what-is-the-ens-subgraph/)
  - ✅ [100% data equivalency](https://github.com/namehash/ens-subgraph-transition-tools) as compared to Subgraph
  - ✅ 100% ensjs test suites passing via [ens-test-env](https://github.com/namehash/ens-test-env)
  - ✅ 100% ens-app-v3 test suites passing via [ens-test-env](https://github.com/namehash/ens-test-env)
- Own your ENSNode index
  - ✅ [Deploy ENSNode to your own cloud](https://ensnode.io/docs/deploying/) for controlling your own uptime guarantees and private queries

## Why Index ENS? Why ENSNode?

The ENS protocol enables resolution of names across multiple chains and, increasingly, offchain data sources. ENS smart contracts optimize for some operations, but not others: for example, if you wanted to list all of a user's owned names, there's no practical way to do this through ENS contracts, and an indexer like ENSNode _must_ be used.

An indexer aggregates and reorganizes the representation of ENS's state to make important queries like that possible, efficient, and convenient:

```graphql
# get all of a user's domains by address — not possible on-chain!
query Domains($adress: String!) {
  domains(where: { owner: $address }) {
    id
    name
    ...
  }
}
```

Historically the ENS Subgraph has served this purpose, but the Subgraph's limitations are increasingly severe as the ENS protocol grows: the ENS Subgraph can only index a single chain at a time (ex: mainnet) and can't integrate with names or that require [CCIP-Read](https://docs.ens.domains/resolvers/ccip-read), which includes all names stored on L2 chains or offchain.

Given how the majority of ENS names are now issued off of mainnet, only a small percentage of ENS names can be indexed by the ENS Subgraph. This issue will only grow more severe with the launch of [ENSv2](https://roadmap.ens.domains/roadmap/) and [Namechain](https://app.ens.domains/ens-v2).

ENSNode is a modern, multichain indexer for ENS. It supports backwards-compatible Subgraph queries and sets the stage for supporting [ENSv2](https://roadmap.ens.domains/roadmap/), in particular [Namechain](https://app.ens.domains/ens-v2) and the growing set of off-chain ENS names (like `.uni.eth` and `.cb.id`).

## Documentation

Documentation for the ENSNode suite of apps is available at [ensnode.io](https://ensnode.io).

## REST API Docs

The REST API Docs are generated from an OpenAPI spec. Two sources are used depending on context:

| Context         | OpenAPI Source                              | Page                                                            |
| --------------- | ------------------------------------------- | --------------------------------------------------------------- |
| **Production**  | Fetched from `https://api.alpha.ensnode.io` | API Reference                                                   |
| **PR Previews** | Committed `openapi.json` file               | [Preview page](https://docs.ensnode.io/ensapi/preview) (hidden) |

This means production docs always reflect the live API, while PR previews can show upcoming API changes before they're deployed.

Mintlify deploys automatically: preview deploys on each branch, production deploys on merge to `main`.

| Content Type      | Source             | Behavior                                    |
| ----------------- | ------------------ | ------------------------------------------- |
| **REST API Docs** | Production API URL | Always in sync with deployed production API |
| **All other docs**    | Committed files    | Deploys immediately on merge to main        |

Non-API documentation (guides, concepts, etc.) may be published before the corresponding code is released to production. The API Reference always reflects the actual production API since Mintlify fetches it from the production URL at build time.

## OpenAPI Spec Sync Check

On every PR, CI runs an `openapi-sync-check` job that:

1. Regenerates the OpenAPI spec from the ENSApi route definitions by running `pnpm generate:openapi`
2. Compares the freshly generated spec against the committed [`ensapi-openapi.json`](docs/docs.ensnode.io/ensapi-openapi.json), failing with a diff if they don't match
3. Validates that Mintlify can parse the spec with `openapi-check`

If you modify any API route schemas in `apps/ensapi`, you must regenerate and commit the updated spec:

```sh
pnpm generate:openapi
```

Then commit the updated `docs/docs.ensnode.io/ensapi-openapi.json`.

## Contributions

We welcome community contributions and feedback—please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## Sponsors

NameHash has received generous support from the [ENS DAO](https://ensdao.org/) and [Gitcoin](https://www.gitcoin.co/).

<p align="middle">
  <a href="https://ensdao.org/" target="_blank"><img src="./docs/ensnode.io/public/ensdao.png" width="180"></a>
  <a href="https://www.gitcoin.co/" target="_blank" style="text-decoration: none;"><img src="./docs/ensnode.io/public/gitcoin.png" width="180"></a>
</p>

## Contact Us

Visit our [website](https://namehashlabs.org/) to get in contact, or [join us on Telegram](https://t.me/ensnode).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.

## Repo Overview

The ENSNode monorepo contains multiple modules in the following subdirectories:

- [`apps`](apps) executable applications.
- [`packages`](packages) for libraries that can be embedded into apps.
- [`docs`](docs) documentation sites.

### [`apps/ensadmin`](apps/ensadmin)

<table>
  <tr>
    <td><img alt="ENSadmin" src=".github/assets/ensadmin-light.svg" width="auto" height="44"></td>
    <td><a href="https://ensnode.io/ensadmin/" target="_blank">ENSAdmin</a></td>
  </tr>
</table>

ENSAdmin is a dashboard for ENSNode and the ENS protocol. See the [ENSAdmin documentation](https://ensnode.io/ensadmin/) for more details.

### [`apps/ensindexer`](apps/ensindexer)

<table>
  <tr>
    <td><img alt="ENSIndexer" src=".github/assets/ensindexer-light.svg" width="auto" height="44"></td>
    <td><a href="https://ensnode.io/ensindexer/" target="_blank">ENSIndexer</a></td>
  </tr>
</table>

ENSIndexer is a Ponder-powered indexer for ENS across mulitple chains. See the [ENSIndexer documentation](https://ensnode.io/ensindexer/) for more details.

### [`apps/ensrainbow`](apps/ensrainbow)

<table>
  <tr>
    <td><img alt="ENSRainbow" src=".github/assets/ensrainbow-light.svg" width="auto" height="44"></td>
    <td><a href="https://ensnode.io/ensrainbow/" target="_blank">ENSRainbow</a></td>
  </tr>
</table>

ENSRainbow heals unknown ENS names: it provides a simple API to recover labels from their labelHashes. See the [ENSRainbow documentation](https://ensnode.io/ensrainbow/) for more details.

## Packages

### [`packages/ensnode-sdk`](packages/ensnode-sdk)

Software Development Kit for interacting with ENSNode services and data. Includes common utilities used across ENSNode applications.

### [`packages/ensnode-react`](packages/ensnode-react)

React hooks and providers for the ENSNode API.

### [`packages/datasources`](packages/datasources)

Convenient catalog of ENSNode-related datasources including chain, contract addresses, start blocks, and event filters.

### [`packages/ensrainbow-sdk`](packages/ensrainbow-sdk)

TypeScript library for interacting with the [ENSRainbow API](apps/ensrainbow).

### [`packages/ensnode-schema`](packages/ensnode-schema)

Shared Drizzle schema definitions used by ENSNode.

### [`packages/ponder-sdk`](packages/ponder-sdk)

A utility library for interacting with Ponder apps and data.

### [`packages/ponder-subgraph`](packages/ponder-subgraph)

Subgraph-compatible GraphQL API.

### [`packages/shared-configs`](packages/shared-configs)

Shared internal configuration files.

## Docs

### [`docs/ensnode.io`](docs/ensnode.io/)

Astro/Starlight documentation app for ENSNode, ENSIndexer, ENSAdmin, and ENSRainbow.

### [`docs/ensrainbow.io`](docs/ensrainbow.io/)

Landing page for ENSRainbow.
