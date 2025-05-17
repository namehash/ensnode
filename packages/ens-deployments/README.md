# @ensnode/ens-deployments

This package provides contract configurations (chain, names, addresses, abis) for each known **ENS Deployment**. An ENS Deployment represents a single, unified namespace of ENS names with a distinct onchain `root` **Datasource** and the capability to span across multiple Datasources on different chains (and, in the future, offchain datasources).

For example, the canonical ENS Deployment on mainnet includes:

- A `root` Datasource documenting the ENS contracts on mainnet, including the `.eth` subregistry
- A `basenames` Datasource documenting the Basenames contracts on Base, including the `.base.eth` subregistry
- A `lineanames` Datasource documenting the Basenames contracts on Linea, including the `.linea.eth` subregistry
- The `threedns-optimism` and `threedns-base` Datasources documenting the 3DNS contracts on Optimism and Base, respectively
- 🚧 Various offchain Datasources (e.g. `.cb.id`, `.uni.eth`)

Each deployment is logically independent and isolated from the others: for instance, the Sepolia and Holesky testnet deployments manage a namespace that is entirely separate from the canonical mainnet deployment, and the `ens-test-env` deployment describes the contracts deployed to an _Anvil_ chain for development and testing with the [ens-test-env](https://github.com/ensdomains/ens-test-env) tool.

This package centralizes the contract addresses, start blocks, and other configuration needed to interact with each deployment.

## Usage

To use these configurations in your project:

```ts
import { ENSDeployments } from "@ensnode/ens-deployments";
import { namehash } from "viem";

// access the address and abi for the root Registry on mainnet
const registryConfig = ENSDeployments.mainnet.root.contracts.Registry;

// for example, querying the Registry with viem...
const vitaliksResolverAddress = await publicClient.readContract({
  abi: registryConfig.abi,
  address: registryConfig.address,
  functionName: "resolver",
  args: [namehash("vitalik.eth")],
});
```

[See the usage of `@ensnode/ens-deployments` within ENSIndexer for additional context.](https://github.com/namehash/ensnode/blob/main/apps/ensindexer/src/plugins/subgraph/subgraph.plugin.ts)

## Documentation

### ENSDeployments

The primary export of `@ensnode/ens-deployments` is `ENSDeployments` which is a `Record<ENSDeploymentChain, ENSDeployment>`.

```ts
import { ENSDeployments } from '@ensnode/ens-deployments';
```

The available `ENSDeploymentChain`s are:
- `mainnet`
- `sepolia`
- `holesky`
- `ens-test-env` — Represents a local testing deployment running on an Anvil chain (chain id 1337) with deterministic configurations that deliberately start at block zero for rapid testing and development. See [ens-test-env](https://github.com/ensdomains/ens-test-env) for additional context.

### ENSDeployment

Each ENS Deployment is defined as a set of **Datasources**, keyed by a unique `DatasourceName`.

The available `DatasourceName`s are:
- `root` — ENS Root Contracts
- `basenames` — Basenames
- `lineanames` — Linea Names
- `threedns-optimism` — 3DNS (on Optimism)
- `threedns-base` — 3DNS (on Base)

### Datasource

A Datasource describes a source `chain` and the set of contracts on that chain that integrate with the ENS protocol.

- `chain` — a `viem#Chain` object
- `contracts` — a `Record<DatasourceName, ContractConfig>`

### ContractConfig

A `ContractConfig` defines the necessary information to interact with a specific contract within a Datasource, and is directly compatible with `ponder#ContractConfig` for ease of use within a [Ponder](https://ponder.sh) indexer.

- `abi` — the contract's ABI
- `address` — (optional) the contract's deployed address
- `filter` — (optional) array of event signatures to filter logs by
- `startBlock` — the block number when the contract was deployed

A contract can be located either by its static `address` or by filtering for specific event signatures. Note that either `address` or `filter` must be provided, but not both.

If a `filter` is provided, the relevant contract is _any_ contract on the indicated chain that emits events following the `filter` spec. This occurs, namely, for `Resolver` contracts — any contract that emits an event that looks like a `Resolver` event should be considered a `Resolver` for the purposes of indexing ENS data.

## Contributions

We welcome community contributions and feedback—please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## Contact Us

Visit our [website](https://namehashlabs.org/) to get in contact, or [join us on Telegram](https://t.me/ensnode).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
