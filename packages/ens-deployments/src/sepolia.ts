import { sepolia } from "viem/chains";

import { ETHResolverFilter } from "./filters";
import type { ENSDeploymentConfig } from "./types";

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
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 3702721,
      },
      Registry: {
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        filter: ETHResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 3702721, // based on startBlock of RegistryOld on Sepolia
      },
      BaseRegistrar: {
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 3702731,
      },
      EthRegistrarControllerOld: {
        address: "0x7e02892cfc2Bfd53a75275451d73cF620e793fc0",
        startBlock: 3790197,
      },
      EthRegistrarController: {
        address: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
        startBlock: 3790244,
      },
      NameWrapper: {
        address: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
        startBlock: 3790153,
      },
    },
  },
  /**
   * On the Sepolia "ENS deployment" there is no known subregistry for direct
   * subnames of 'base.eth' or 'linea.eth'.
   */
} satisfies ENSDeploymentConfig;
