import { zeroAddress } from "viem";
import {
  arbitrumSepolia,
  baseSepolia,
  lineaSepolia,
  optimismSepolia,
  scrollSepolia,
  sepolia,
} from "viem/chains";

// ABIs for ENSv2 Datasource
import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { UniversalResolverABI } from "./abis/shared/UniversalResolver";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

/**
 * The block after which ENSv1 contracts (like Resolver) must be indexed, since they could still be
 * used with a sepolia-v2 deployment.
 */
const SEPOLIA_ENSV1_DEPLOYMENT_BLOCK = 3702721;

/**
 * The earliest deploy block of the Sepolia ENSv1+v2 test deployment.
 *
 * @dev this is the earliest block of _any_ Sepolia ENSv1+v2 test deployment, since the ENS Team
 * has shown in the past that a previous deployment's contracts may be used with a future deployment.
 */
const SEPOLIA_ENSV2_DEPLOYMENT_BLOCK = 10400000;

/**
 * The Sepolia V2 ENSNamespace
 *
 * This represents a testing deployment of ENSv1 w/ ENSv2 on Sepolia.
 */
export default {
  /**
   * ENS Root contracts deployed on Sepolia for the ENSv1 + ENSv2 test deployment.
   *
   * NOTE: `LegacyEthRegistrarController`, `WrappedEthRegistrarController`, and
   * `UniversalRegistrarRenewalWithReferrer` are not part of this deployment and are therefore
   * omitted; consumers of this datasource must treat them as optional.
   */
  [DatasourceNames.ENSRoot]: {
    chain: sepolia,
    contracts: {
      // The legacy ENS Registry was not deployed in this test deployment; set to the zero address.
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: zeroAddress,
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      // NOTE: named ENSRegistry in deployment
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: SEPOLIA_ENSV1_DEPLOYMENT_BLOCK,
      },
      // NOTE: named BaseRegistrarImplementation in deployment
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xa51c9e6efe589407c72984e93b45e35a71a398ec",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      // NOTE: named ETHRegistrarController in deployment
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xb5778cf6cc9586d9ce740039c84dfb1802f307bc",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x250a6c640297f605b63c6e91c7cd376f04b288da",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      UniversalResolver: {
        abi: UniversalResolverABI,
        address: "0x651d670ce0d0f1ed0893f39d51fd0dbd4546c9ef",
        startBlock: 10893223,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: sepolia,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: SEPOLIA_ENSV1_DEPLOYMENT_BLOCK },
      Registry: { abi: Registry, startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      RootRegistry: {
        abi: Registry,
        address: "0x835f0b284e78cd3f358bcf6cba3b53809f09b79e",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepolia,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x26997c9d0f3dcbae3f78c69e621a3926ee30bb98",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },

      // NOTE: named PublicResolver in deployment
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0xb441cb480460eb8b2964dcb82b64a883b14abf3e",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },

      BaseReverseResolver: {
        abi: ResolverABI,
        address: "0xaf3b3f636be80b6709f5bd3a374d6ac0d0a7c7aa",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      LineaReverseResolver: {
        abi: ResolverABI,
        address: "0x083da1dbc0f379ccda6ac81a934207c3d8a8a205",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      OptimismReverseResolver: {
        abi: ResolverABI,
        address: "0xc9ae189772bd48e01410ab3be933637ee9d3aa5f",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      ArbitrumReverseResolver: {
        abi: ResolverABI,
        address: "0x926f94d2adc77c86cb0050892097d49aadd02e8b",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
      },
      ScrollReverseResolver: {
        abi: ResolverABI,
        address: "0x9fa59673e43f15bdb8722fdaf5c2107574b99062",
        startBlock: SEPOLIA_ENSV2_DEPLOYMENT_BLOCK,
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
        abi: StandaloneReverseRegistrar,
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
        abi: StandaloneReverseRegistrar,
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
        abi: StandaloneReverseRegistrar,
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
        abi: StandaloneReverseRegistrar,
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
        abi: StandaloneReverseRegistrar,
        address: "0x00000beef055f7934784d6d81b6bc86665630dba",
        startBlock: 9267966,
      },
    },
  },
} satisfies ENSNamespace;
