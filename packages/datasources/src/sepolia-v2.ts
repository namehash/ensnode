import { sepolia } from "viem/chains";

import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalRegistrarRenewalWithReferrer as root_UniversalRegistrarRenewalWithReferrer } from "./abis/root/UniversalRegistrarRenewalWithReferrer";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

/**
 * The Sepolia V2 ENSNamespace
 *
 * This represents the ENS V2 deployment on Sepolia, a separate namespace from the original Sepolia
 * ENS deployment, used for testing ENSv2.
 */
export default {
  [DatasourceNames.ENSRoot]: {
    chain: sepolia,
    contracts: {
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
        startBlock: 3702721,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        abi: ResolverABI,
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
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: "0x7ab2947592c280542e680ba8f08a589009da8644",
        startBlock: 9447519,
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

      // ENS V2 contracts

      RootRegistry: {
        abi: Registry,
        address: "0x245de1984f9bb890c5db0b1fb839470c6a4c7e08",
        startBlock: 9771022,
      },
      UniversalResolverV2: {
        abi: root_UniversalResolver,
        address: "0x50168842c0f5c9992a34085d9a6dc5b0a4f306ce",
        startBlock: 9771281,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x3f0920aa92c5f9bce54643c09955c5f241f1f763",
        startBlock: 9771260,
      },
      Registry: {
        abi: Registry,
        startBlock: 9770973,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9770973,
      },
    },
  },

  [DatasourceNames.Namechain]: {
    chain: sepolia,
    contracts: {
      Resolver: {
        abi: ResolverABI,
        startBlock: 3702721,
      },
      Registry: {
        abi: Registry,
        startBlock: 9770973,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9770973,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0xf332544e6234f1ca149907d0d4658afd5feb6831",
        startBlock: 9770973,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0xe37a1366c827d18dc0ad57f3767de4b3025ceac2",
        startBlock: 9843689,
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

      DefaultPublicResolver3: {
        abi: ResolverABI,
        address: "0x8fade66b79cc9f707ab26799354482eb93a5b7dd",
        startBlock: 3790251,
      },
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x8948458626811dd0c23eb25cc74291247077cc51",
        startBlock: 7035086,
      },
      DefaultPublicResolver5: {
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
} satisfies ENSNamespace;
