import { mergeAbis } from "@ponder/utils";
import { sepolia } from "viem/chains";

import { ETHResolverFilter } from "./lib/filters";
import type { ENSDeploymentConfig } from "./lib/types";

// Subregistry ABIs for direct subnames of 'eth' on Sepolia
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/eth/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/eth/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/eth/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/eth/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/eth/NameWrapper";
import { Registry as eth_Registry } from "./abis/eth/Registry";
import { Resolver as eth_Resolver } from "./abis/eth/Resolver";

/**
 * The "ENS deployment" configuration for 'sepolia'.
 */
export default {
  /**
   * Subregistry for direct subnames of 'eth' on the Sepolia "ENS deployment".
   */
  eth: {
    chain: sepolia,

    // Addresses and Start Blocks from ENS Sepolia Subgraph Manifest
    // https://ipfs.io/ipfs/QmdDtoN9QCRsBUsyoiiUUMQPPmPp5jimUQe81828UyWLtg
    contracts: {
      RegistryOld: {
        abi: eth_Registry,
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 3702721,
      },
      Registry: {
        abi: eth_Registry,
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
        filter: ETHResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 3702721, // based on startBlock of RegistryOld on Sepolia
      },
      BaseRegistrar: {
        abi: eth_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 3702731,
      },
      EthRegistrarControllerOld: {
        abi: eth_EthRegistrarControllerOld,
        address: "0x7e02892cfc2Bfd53a75275451d73cF620e793fc0",
        startBlock: 3790197,
      },
      EthRegistrarController: {
        abi: eth_EthRegistrarController,
        address: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
        startBlock: 3790244,
      },
      NameWrapper: {
        abi: eth_NameWrapper,
        address: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
        startBlock: 3790153,
      },
    },
  },
  /**
   * On the Sepolia "ENS deployment" there is no known subregistry for direct subnames of 'base.eth'.
   *
   * linea.eth's L1Resolver is deployed to Sepolia, but we do not index Linea Sepolia names here.
   * https://github.com/Consensys/linea-ens/tree/main/packages/linea-ens-resolver/deployments/sepolia
   */
} satisfies ENSDeploymentConfig;
