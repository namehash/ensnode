# @ensnode/ens-deployments

This package provides configurations for each known "ENS deployment". An ENS deployment represents a single, unified namespace of ENS names with a distinct onchain root Registry and the capability to span across multiple chains, subregistries, and offchain resources.

For example, the canonical ENS deployment on mainnet includes:

- A root Registry on mainnet
- An onchain subregistry for direct subnames of 'eth' on mainnet
- An onchain subregistry for direct subnames of 'base.eth' on Base
- An onchain subregistry for direct subnames of 'linea.eth' on Linea
- Various offchain subregistries (e.g. '.cb.id', '.uni.eth')

Each deployment is independent - for instance, the Sepolia and Holesky testnet deployments are separate from the canonical mainnet deployment. This package centralizes the contract addresses, start blocks, and other configuration needed to interact with each deployment.

## Terminology

If you are unfamiliar with any of the terminology used here, please reference the [terminology](https://www.ensnode.io/reference/terminology) document for additional context.

## Overview

Each ENS deployment is defined as a separate configuration that includes:

- **Chain configuration:** The target blockchain (e.g. mainnet, sepolia, holesky, or a local test environment).
- **Subregistry details:** For example, configurations for direct subnames of `eth` (required for every deployment), and for `base.eth` and `linea.eth` in the mainnet deployment.
- **Contract information:** Addresses, start blocks, and event filters for relevant contracts like the Registry, Resolver, BaseRegistrar, and Controller contracts.

## Supported Deployments

- **mainnet**
  Provides configurations for the main Ethereum network and includes subregistries for:

  - `eth` – mainnet ENS registry
  - `base` – subnames of `.base.eth` on Base
  - `linea` – subnames of `.linea.eth` on Linea

- **sepolia**
  Contains configurations for the Sepolia testnet.

- **holesky**
  Defines a configuration for the Holesky testnet.

- **ens-test-env**
  Represents a local testing deployment running on an Anvil chain (chain id 1337) with deterministic configurations that deliberately start at block zero for rapid testing and development. See [ens-test-env](https://github.com/ensdomains/ens-test-env) for additional context.

## Usage

To use these configurations in your project:

```ts
import { DeploymentConfigs } from "@ensnode/ens-deployments";
import { namehash } from "viem";

// access the address and abi for the root Registry on mainnet
const registryConfig = DeploymentConfigs.mainnet.eth.contracts.Registry;

// for example, querying the Registry with viem...
const vitaliksResolverAddress = await publicClient.readContract({
  abi: registryConfig.abi,
  address: registryConfig.address,
  functionName: "resolver",
  args: [namehash("vitalik.eth")],
});
```

The exported `DeploymentConfigs` provides a mapping from an `ENSDeploymentChain` (e.g. `"mainnet"`, `"sepolia"`, `"holesky"`, `"ens-test-env"`) to the corresponding deployment configuration.
