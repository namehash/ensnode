import { zeroAddress } from "viem";
import { sepolia } from "viem/chains";

// ABIs for ENSv2 Datasource
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
 * This represents a testing deployment of ENSv1 w/ ENSv2 on Sepolia.
 *
 * @dev we use the earliest start block for simplicity (it's just for efficiency re: log fetches).
 */
export default {
  /**
   * ENS Root contracts deployed on Sepolia for the ENSv1 + ENSv2 test deployment.
   *
   * NOTE: `UniversalRegistrarRenewalWithReferrer` is a placeholder entry required by the typesystem
   * due to the registrar plugin; it does not exist on Sepolia V2 and therefore uses the zero address.
   */
  [DatasourceNames.ENSRoot]: {
    chain: sepolia,
    contracts: {
      ENSv1RegistryOld: {
        abi: root_Registry,
        address: "0x4355f1c6b5b59818dc56e336d1584df35d47ad86",
        startBlock: 9374708,
      },
      ENSv1Registry: {
        abi: root_Registry,
        address: "0x17795c119b8155ab9d3357c77747ba509695d7cb",
        startBlock: 9374708,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 9374708,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xb16870800de7444f6b2ebd885465412a5e581614",
        startBlock: 9374708,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x25da9aa54dae4afa6534ba829c6288039d4f5ebb",
        startBlock: 9374708,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x4f1d36f2c1382a01006077a42de53f7c843d1a83",
        startBlock: 9374708,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x99e517db3db5ec5424367b8b50cd11ddcb0008f1",
        startBlock: 9374708,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xca7e6d0ddc5f373197bbe6fc2f09c2314399f028",
        startBlock: 9374708,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0x198827b2316e020c48b500fc3cebdbcaf58787ce",
        startBlock: 9374708,
      },
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 9374708,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: sepolia,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: 9374708 },
      Registry: { abi: Registry, startBlock: 9374708 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 9374708 },
      RootRegistry: {
        abi: Registry,
        address: "0x245de1984f9bb890c5db0b1fb839470c6a4c7e08",
        startBlock: 9374708,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x3f0920aa92c5f9bce54643c09955c5f241f1f763",
        startBlock: 9374708,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x3334f0ebcbc4b5b7067f3aff25c6da8973690d54",
        startBlock: 9374708,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepolia,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0xf7fca8d7b8b802d07a1011b69a5e39395197b730",
        startBlock: 9374708,
      },
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0xa238d3aca667210d272391a119125d38816af4b1",
        startBlock: 9374708,
      },
      BaseReverseResolver: {
        abi: ResolverABI,
        address: "0xf849bc9d818ac09a629ae981b03bcbcdca750e8f",
        startBlock: 9374708,
      },
      LineaReverseResolver: {
        abi: ResolverABI,
        address: "0xc8e393f59be1ec4d44ea9190e6831d3c4a94dfa7",
        startBlock: 9374708,
      },
      OptimismReverseResolver: {
        abi: ResolverABI,
        address: "0x05e889ba6c7a2399ea9ce4e9666f1e863b0f1728",
        startBlock: 9374708,
      },
      ArbitrumReverseResolver: {
        abi: ResolverABI,
        address: "0x18b9b7158c16194b6d4c4fde85de92b035a3ce77",
        startBlock: 9374708,
      },
      ScrollReverseResolver: {
        abi: ResolverABI,
        address: "0xd854f312888d0a5d64b646932a2ed8e8bad8de87",
        startBlock: 9374708,
      },
    },
  },
} satisfies ENSNamespace;
