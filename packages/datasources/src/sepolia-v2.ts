// ABIs for ENSv2 Datasource
import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
import { UniversalResolverV2 } from "./abis/ensv2/UniversalResolverV2";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolverV1 } from "./abis/root/UniversalResolverV1";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { sepoliaV2Chain } from "./lib/chains";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

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
    chain: sepoliaV2Chain,
    contracts: {
      // NOTE: named LegacyENSRegistry in deployment
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
        startBlock: 3702721,
      },
      // NOTE: named ENSRegistry in deployment
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock: 3702728,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 3702721, // ignores any Resolver events prior to `startBlock` of ENSv1RegistryOld
      },
      // NOTE: named BaseRegistrarImplementation in deployment
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        startBlock: 3702731,
      },
      // NOTE: named ETHRegistrarController in deployment
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
        abi: UniversalResolverV1,
        address: "0x3c85752a5d47dd09d677c645ff2a938b38fbfeba",
        startBlock: 8928722,
      },
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: "0xfef81312438b7e578ee94bf0e8fa5c2547653d7c",
        startBlock: 10887910,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: sepoliaV2Chain,
    contracts: {
      // factory-pattern entries: start at the earliest deploy block of any ENSv2 contract (RootRegistry)
      Resolver: { abi: ResolverABI, startBlock: 10887910 },
      Registry: { abi: Registry, startBlock: 10887910 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 10887910 },
      RootRegistry: {
        abi: Registry,
        address: "0x078a7ae41974a74c62233bca5590c86218aa1f1e",
        startBlock: 10887910,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0xc328a01a4800fb52ec5a6ab4190356962ab719e5",
        startBlock: 10887910,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0xd859dac731dab4aecddb154b639d868dc951da62",
        startBlock: 10887910,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepoliaV2Chain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x4f382928805ba0e23b30cfb75fc9e848e82dfd47",
        startBlock: 8579966,
      },

      // NOTE: named DefaultReverseResolver in deployment
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x9dc60e7bd81ccc96774c55214ff389d42ae5e9ac",
        startBlock: 8580041,
      },

      // NOTE: named LegacyPublicResolver in deployment
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x0ceec524b2807841739d3b5e161f5bf1430ffa48",
        startBlock: 3790166,
      },

      // NOTE: named PublicResolver in deployment
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0xe99638b40e4fff0129d56f03b55b6bbc4bbe49b5",
        startBlock: 8580001,
      },
      BaseReverseResolver: {
        abi: ResolverABI,
        address: "0xaf3b3f636be80b6709f5bd3a374d6ac0d0a7c7aa",
        startBlock: 8580004,
      },
      LineaReverseResolver: {
        abi: ResolverABI,
        address: "0x083da1dbc0f379ccda6ac81a934207c3d8a8a205",
        startBlock: 8580005,
      },
      OptimismReverseResolver: {
        abi: ResolverABI,
        address: "0xc9ae189772bd48e01410ab3be933637ee9d3aa5f",
        startBlock: 8580026,
      },
      ArbitrumReverseResolver: {
        abi: ResolverABI,
        address: "0x926f94d2adc77c86cb0050892097d49aadd02e8b",
        startBlock: 8580003,
      },
      ScrollReverseResolver: {
        abi: ResolverABI,
        address: "0x9fa59673e43f15bdb8722fdaf5c2107574b99062",
        startBlock: 8580040,
      },
    },
  },
} satisfies ENSNamespace;
