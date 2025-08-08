import {
  arbitrumSepolia,
  baseSepolia,
  lineaSepolia,
  optimismSepolia,
  scrollSepolia,
  sepolia,
} from "viem/chains";

import { DatasourceNames, type ENSNamespace } from "./lib/types";

// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";

// ABIs for Basenames Datasource
import { BaseRegistrar as base_BaseRegistrar } from "./abis/basenames/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EARegistrarController } from "./abis/basenames/EARegistrarController";
import { RegistrarController as base_RegistrarController } from "./abis/basenames/RegistrarController";
import { Registry as base_Registry } from "./abis/basenames/Registry";

// ABIs for Lineanames Datasource
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/lineanames/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/lineanames/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/lineanames/NameWrapper";
import { Registry as linea_Registry } from "./abis/lineanames/Registry";

// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI, ResolverFilter } from "./lib/resolver";

/**
 * The Sepolia ENSNamespace
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ENS Sepolia Subgraph Manifest
   * https://ipfs.io/ipfs/QmdDtoN9QCRsBUsyoiiUUMQPPmPp5jimUQe81828UyWLtg
   */
  [DatasourceNames.ENSRoot]: {
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
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 3702721, // ignores any Resolver events prior to `startBlock` of RegistryOld on Sepolia
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 3702731,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x7e02892cfc2Bfd53a75275451d73cF620e793fc0",
        startBlock: 3790197,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
        startBlock: 3790244,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968",
        startBlock: 8579988,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
        startBlock: 3790153,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xb7B7DAdF4D42a08B3eC1d3A1079959Dfbc8CFfCC",
        startBlock: 8515717,
      },
    },
  },

  /**
   * Basenames Datasource
   *
   * Addresses and Start Blocks from Basenames
   * https://github.com/base-org/basenames
   */
  [DatasourceNames.Basenames]: {
    /**
     * As of 5-Jun-2025 the Resolver for 'basetest.eth' in the Sepolia ENS namespace is
     * 0x084D10C07EfEecD9fFc73DEb38ecb72f9eEb65aB.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'basetest.eth' to an offchain
     * gateway server operated by Coinbase that uses the following subregistry contracts on
     * Base Sepolia as its source of truth.
     *
     * The owner of 'basetest.eth' in the ENS Registry on the Sepolia ENS namespace
     * (e.g. Coinbase) has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: baseSepolia,
    contracts: {
      Registry: {
        abi: base_Registry,
        address: "0x1493b2567056c2181630115660963E13A8E32735",
        startBlock: 13012458,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 13012458,
      },
      BaseRegistrar: {
        abi: base_BaseRegistrar,
        address: "0xA0c70ec36c010B55E3C434D6c6EbEEC50c705794",
        startBlock: 13012465,
      },
      EARegistrarController: {
        abi: base_EARegistrarController,
        address: "0x3a0e8c2a0a28f396a5e5b69edb2e630311f1517a",
        startBlock: 13041164,
      },
      RegistrarController: {
        abi: base_RegistrarController,
        address: "0x49aE3cC2e3AA768B1e5654f5D3C6002144A59581",
        startBlock: 13298580,
      },
    },
  },

  /**
   * Lineanames Datasource
   *
   * Addresses and Start Blocks from Lineanames
   * https://github.com/Consensys/linea-ens
   */
  [DatasourceNames.Lineanames]: {
    /**
     * As of 5-Jun-2025 the Resolver for 'linea-sepolia.eth' in the Sepolia ENS namespace is
     * 0x64884ED06241c059497aEdB2C7A44CcaE6bc7937.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'linea-sepolia.eth' to an offchain
     * gateway server operated by Consensys that uses the following subregistry contracts on
     * Linea Sepolia as its source of truth.
     *
     * The owner of 'linea-sepolia.eth' in the ENS Registry on the Sepolia ENS namespace
     * (e.g. Consensys) has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: lineaSepolia,
    contracts: {
      Registry: {
        abi: linea_Registry,
        address: "0x5B2636F0f2137B4aE722C01dd5122D7d3e9541f7",
        startBlock: 2395094,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 2395094, // based on startBlock of Registry on Linea Sepolia
      },
      BaseRegistrar: {
        abi: linea_BaseRegistrar,
        address: "0x83475a84C0ea834F06c8e636A62631e7d2e07A44",
        startBlock: 2395099,
      },
      EthRegistrarController: {
        abi: linea_EthRegistrarController,
        address: "0x0f81E3B3A32DFE1b8A08d3C0061d852337a09338",
        startBlock: 2395231,
      },
      NameWrapper: {
        abi: linea_NameWrapper,
        address: "0xF127De9E039a789806fEd4C6b1C0f3aFfeA9425e",
        startBlock: 2395202,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on the (Sepolia) ENS Root chain.
   */
  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepolia,
    contracts: {
      // NOTE: DefaultReverseResolver1 does not exist on Sepolia (see mainnet.ts for context)
      DefaultReverseResolver2: {
        abi: ResolverABI,
        address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
        startBlock: 3790251,
      },
      // TODO: document Sepolia DefaultReverseResolver3

      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x4F382928805ba0e23B30cFB75fC9E848e82DFD47",
        startBlock: 8579966,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Base Sepolia.
   */
  [DatasourceNames.ReverseResolverBase]: {
    chain: baseSepolia,
    contracts: {
      L2ReverseRegistrar: {
        abi: ResolverABI,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 21788010,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Optimism Sepolia.
   */
  [DatasourceNames.ReverseResolverOptimism]: {
    chain: optimismSepolia,
    contracts: {
      L2ReverseRegistrar: {
        abi: ResolverABI,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 23770766,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Arbitrum Sepolia.
   */
  [DatasourceNames.ReverseResolverArbitrum]: {
    chain: arbitrumSepolia,
    contracts: {
      L2ReverseRegistrar: {
        abi: ResolverABI,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 123142726,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Scroll Sepolia.
   */
  [DatasourceNames.ReverseResolverScroll]: {
    chain: scrollSepolia,
    contracts: {
      L2ReverseRegistrar: {
        abi: ResolverABI,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 8175276,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Linea Sepolia.
   */
  [DatasourceNames.ReverseResolverLinea]: {
    chain: lineaSepolia,
    contracts: {
      L2ReverseRegistrar: {
        abi: ResolverABI,
        address: "0x00000BeEF055f7934784D6d81b6BC86665630dbA",
        startBlock: 9267966,
      },
    },
  },
} satisfies ENSNamespace;
