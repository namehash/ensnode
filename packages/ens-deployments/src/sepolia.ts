import {
  arbitrumSepolia,
  baseSepolia,
  lineaSepolia,
  optimismSepolia,
  scrollSepolia,
  sepolia,
} from "viem/chains";

import { ResolverConfig } from "./lib/resolver";
import { DatasourceName, type ENSDeployment } from "./lib/types";

// ABIs for Root Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { EthRegistrarController as root_EthRegistrarController } from "./abis/root/EthRegistrarController";
import { EthRegistrarControllerOld as root_EthRegistrarControllerOld } from "./abis/root/EthRegistrarControllerOld";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";

/**
 * The Sepolia ENSDeployment
 */
export default {
  /**
   * Root Datasource
   *
   * Addresses and Start Blocks from ENS Sepolia Subgraph Manifest
   * https://ipfs.io/ipfs/QmdDtoN9QCRsBUsyoiiUUMQPPmPp5jimUQe81828UyWLtg
   */
  [DatasourceName.Root]: {
    chain: sepolia,
    contracts: {
      RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 3702721,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        ...ResolverConfig,
        startBlock: 3702721, // ignores any Resolver events prior to `startBlock` of RegistryOld on Sepolia
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 3702731,
      },
      EthRegistrarControllerOld: {
        abi: root_EthRegistrarControllerOld,
        address: "0x7e02892cfc2Bfd53a75275451d73cF620e793fc0",
        startBlock: 3790197,
      },
      EthRegistrarController: {
        abi: root_EthRegistrarController,
        address: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
        startBlock: 3790244,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
        startBlock: 3790153,
      },
    },
  },
  /**
   * The Sepolia ENSDeployment has no known Datasource for Basenames.
   *
   * linea.eth's L1Resolver is deployed to Sepolia, but we do not index Linea Sepolia names here.
   * https://github.com/Consensys/linea-ens/tree/main/packages/linea-ens-resolver/deployments/sepolia
   */

  /**
   * The Reverse Resolver on the ENS Root chain.
   */
  [DatasourceName.ReverseResolverRoot]: {
    chain: sepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
        startBlock: 3790251,
      },
    },
  },

  /**
   * The Reverse Resolver on Base.
   */
  [DatasourceName.ReverseResolverBase]: {
    chain: baseSepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 21788010,
      },
    },
  },

  /**
   * The Reverse Resolver on Optimism.
   */
  [DatasourceName.ReverseResolverOptimism]: {
    chain: optimismSepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 23770766,
      },
    },
  },

  /**
   * The Reverse Resolver on Arbitrum.
   */
  [DatasourceName.ReverseResolverArbitrum]: {
    chain: arbitrumSepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 123142726,
      },
    },
  },

  /**
   * The Reverse Resolver on Scroll.
   */
  [DatasourceName.ReverseResolverScroll]: {
    chain: scrollSepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 8175276,
      },
    },
  },

  /**
   * The Reverse Resolver on Linea.
   */
  [DatasourceName.ReverseResolverLinea]: {
    chain: lineaSepolia,
    contracts: {
      ReverseResolver: {
        abi: ResolverConfig.abi,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 9267966,
      },
    },
  },
} satisfies ENSDeployment;
