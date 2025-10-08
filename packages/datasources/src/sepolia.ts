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
import { UpgradeableRegistrarController as base_UpgradeableRegistrarController } from "./abis/basenames/UpgradeableRegistrarController";

// ABIs for Lineanames Datasource
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/lineanames/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/lineanames/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/lineanames/NameWrapper";
import { Registry as linea_Registry } from "./abis/lineanames/Registry";

import { Seaport as Seaport1_5 } from "./abis/seaport/Seaport1.5";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI, ResolverFilter } from "./lib/resolver";

/**
 * The Sepolia ENSNamespace
 *
 * NOTE: The Sepolia ENS namespace does not support 3DNS.
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
        address: "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
        startBlock: 3702721,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 3702721, // ignores any Resolver events prior to `startBlock` of RegistryOld on Sepolia
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        startBlock: 3702731,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x7e02892cfc2bfd53a75275451d73cf620e793fc0",
        startBlock: 3790197,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0xfed6a969aaa60e4961fcd3ebf1a2e8913ac65b72",
        startBlock: 3790244,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xfb3ce5d01e0f33f41dbb39035db9745962f1f968",
        startBlock: 8579988,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x0635513f179d50a207757e05759cbd106d7dfce8",
        startBlock: 3790153,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xb7b7dadf4d42a08b3ec1d3a1079959dfbc8cffcc",
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
        address: "0x1493b2567056c2181630115660963e13a8e32735",
        startBlock: 13012458,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 13012458,
      },
      BaseRegistrar: {
        abi: base_BaseRegistrar,
        address: "0xa0c70ec36c010b55e3c434d6c6ebeec50c705794",
        startBlock: 13012465,
      },
      EARegistrarController: {
        abi: base_EARegistrarController,
        address: "0x3a0e8c2a0a28f396a5e5b69edb2e630311f1517a",
        startBlock: 13041164,
      },
      RegistrarController: {
        abi: base_RegistrarController,
        address: "0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581",
        startBlock: 13298580,
      },
      /**
       * This controller was added to BaseRegistrar contract
       * with the following tx:
       * https://sepolia.basescan.org/tx/0x648d984c1a379a6c300851b9561fe98a9b5282a26ca8c2c7660b11c53f0564bc
       */
      UpgradeableRegistrarController: {
        abi: base_UpgradeableRegistrarController,
        address: "0x82c858cdf64b3d893fe54962680edfddc37e94c8", // a proxy contract
        startBlock: 29896051,
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
        address: "0x5b2636f0f2137b4ae722c01dd5122d7d3e9541f7",
        startBlock: 2395094,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 2395094, // based on startBlock of Registry on Linea Sepolia
      },
      BaseRegistrar: {
        abi: linea_BaseRegistrar,
        address: "0x83475a84c0ea834f06c8e636a62631e7d2e07a44",
        startBlock: 2395099,
      },
      EthRegistrarController: {
        abi: linea_EthRegistrarController,
        address: "0x0f81e3b3a32dfe1b8a08d3c0061d852337a09338",
        startBlock: 2395231,
      },
      NameWrapper: {
        abi: linea_NameWrapper,
        address: "0xf127de9e039a789806fed4c6b1c0f3affea9425e",
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
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x4f382928805ba0e23b30cfb75fc9e848e82dfd47",
        startBlock: 8579966,
      },

      DefaultReverseResolver1: {
        abi: ResolverABI,
        address: "0x8fade66b79cc9f707ab26799354482eb93a5b7dd",
        startBlock: 3790251,
      },
      DefaultReverseResolver2: {
        abi: ResolverABI,
        address: "0x8948458626811dd0c23eb25cc74291247077cc51",
        startBlock: 7035086,
      },
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x9dc60e7bd81ccc96774c55214ff389d42ae5e9ac",
        startBlock: 8580041,
      },

      DefaultPublicResolver1: {
        abi: ResolverABI,
        address: "0x8fade66b79cc9f707ab26799354482eb93a5b7dd",
        startBlock: 3790251,
      },
      DefaultPublicResolver2: {
        abi: ResolverABI,
        address: "0x8948458626811dd0c23eb25cc74291247077cc51",
        startBlock: 7035086,
      },
      DefaultPublicResolver3: {
        abi: ResolverABI,
        address: "0xe99638b40e4fff0129d56f03b55b6bbc4bbe49b5",
        startBlock: 8580001,
      },

      BaseReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html?sepolia#80014a34.reverse
        address: "0xaf3b3f636be80b6709f5bd3a374d6ac0d0a7c7aa",
        startBlock: 8580004,
      },

      LineaReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html?sepolia#8000e705.reverse
        address: "0x083da1dbc0f379ccda6ac81a934207c3d8a8a205",
        startBlock: 8580005,
      },

      OptimismReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html?sepolia#80aa37dc.reverse
        address: "0xc9ae189772bd48e01410ab3be933637ee9d3aa5f",
        startBlock: 8580026,
      },

      ArbitrumReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html?sepolia#80066eee.reverse
        address: "0x926f94d2adc77c86cb0050892097d49aadd02e8b",
        startBlock: 8580003,
      },

      ScrollReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html?sepolia#8008274f.reverse
        address: "0x9fa59673e43f15bdb8722fdaf5c2107574b99062",
        startBlock: 8580040,
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
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
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
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
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
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
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
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
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
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
        startBlock: 9267966,
      },
    },
  },

  [DatasourceNames.Seaport]: {
    chain: sepolia,
    contracts: {
      Seaport1_5: {
        abi: Seaport1_5, // Seaport 1.5
        address: "0x00000000000000adc04c56bf30ac9d3c0aaf14dc",
        startBlock: 3365529,
      },
    },
  },
} satisfies ENSNamespace;
