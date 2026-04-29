import { zeroAddress } from "viem";

// ABIs for ENSv2 Datasource
import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
import { UniversalResolverV2 } from "./abis/ensv2/UniversalResolverV2";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalRegistrarRenewalWithReferrer as root_UniversalRegistrarRenewalWithReferrer } from "./abis/root/UniversalRegistrarRenewalWithReferrer";
import { UniversalResolverV1 } from "./abis/root/UniversalResolverV1";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { sepoliaV2Chain } from "./lib/chains";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

// we use the earliest start block for simplicity (it's just for efficiency re: log fetches)
// derived from the deploy block of LegacyENSRegistry (0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b)
const startBlock = 3702720;

/**
 * The Sepolia V2 ENSNamespace
 *
 * This represents a testing deployment of ENSv1 w/ ENSv2 on Sepolia.
 */
export default {
  /**
   * ENS Root contracts deployed on Sepolia for the ENSv1 + ENSv2 test deployment.
   *
   * NOTE: `UniversalRegistrarRenewalWithReferrer` is a placeholder entry required by the typesystem
   * due to the registrar plugin; it does not exist on Sepolia V2 and therefore uses the zero address.
   */
  [DatasourceNames.ENSRoot]: {
    chain: sepoliaV2Chain,
    contracts: {
      // NOTE: named LegacyENSRegistry in deployment
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
        startBlock,
      },
      // NOTE: named ENSRegistry in deployment
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock,
      },
      // NOTE: named BaseRegistrarImplementation in deployment
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        startBlock,
      },
      // NOTE: as per ENS Team, indexing this contract isn't relevant in sepolia-v2 namespace
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: zeroAddress,
        startBlock,
      },
      // NOTE: as per ENS Team, indexing this contract isn't relevant in sepolia-v2 namespace
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: zeroAddress,
        startBlock,
      },
      // NOTE: named LegacyETHRegistrarController in deployment
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x7e02892cfc2bfd53a75275451d73cf620e793fc0",
        startBlock,
      },
      // NOTE: not in deployment, set to zeroAddress
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x0635513f179d50a207757e05759cbd106d7dfce8",
        startBlock,
      },
      UniversalResolver: {
        abi: UniversalResolverV1,
        address: "0x3c85752a5d47dd09d677c645ff2a938b38fbfeba",
        startBlock,
      },
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: "0x4dc74fef4fc6b5a810a1554d431f06c8d8b7451c",
        startBlock,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: sepoliaV2Chain,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock },
      Registry: { abi: Registry, startBlock },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock },
      RootRegistry: {
        abi: Registry,
        address: "0x45e6d4230064f9dd806330da9d92639f8665d9bf",
        startBlock,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x28356dacb84ee3ebdb007d1f5920b24c87e90d40",
        startBlock,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x29e8a042ea34b7ee720c12b52720027b5e9049c6",
        startBlock,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepoliaV2Chain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x4f382928805ba0e23b30cfb75fc9e848e82dfd47",
        startBlock,
      },

      // NOTE: named DefaultReverseResolver in deployment
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x9dc60e7bd81ccc96774c55214ff389d42ae5e9ac",
        startBlock,
      },

      // NOTE: named LegacyPublicResolver in deployment
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x0ceec524b2807841739d3b5e161f5bf1430ffa48",
        startBlock,
      },

      // NOTE: named PublicResolver in deployment
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0xe99638b40e4fff0129d56f03b55b6bbc4bbe49b5",
        startBlock,
      },
      BaseReverseResolver: {
        abi: ResolverABI,
        address: "0xaf3b3f636be80b6709f5bd3a374d6ac0d0a7c7aa",
        startBlock,
      },
      LineaReverseResolver: {
        abi: ResolverABI,
        address: "0x083da1dbc0f379ccda6ac81a934207c3d8a8a205",
        startBlock,
      },
      OptimismReverseResolver: {
        abi: ResolverABI,
        address: "0xc9ae189772bd48e01410ab3be933637ee9d3aa5f",
        startBlock,
      },
      ArbitrumReverseResolver: {
        abi: ResolverABI,
        address: "0x926f94d2adc77c86cb0050892097d49aadd02e8b",
        startBlock,
      },
      ScrollReverseResolver: {
        abi: ResolverABI,
        address: "0x9fa59673e43f15bdb8722fdaf5c2107574b99062",
        startBlock,
      },
    },
  },
} satisfies ENSNamespace;
