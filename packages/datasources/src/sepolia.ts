import { sepolia } from "viem/chains";

// ABIs for Namechain
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
import { Seaport as Seaport1_5 } from "./abis/seaport/Seaport1.5";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

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
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x4355f1c6b5b59818dc56e336d1584df35d47ad86",
        startBlock: 9374708,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x17795c119b8155ab9d3357c77747ba509695d7cb",
        startBlock: 9374709,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 9374708, // ignores any Resolver events prior to `startBlock` of ENSv1RegistryOld on Sepolia
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xb16870800de7444f6b2ebd885465412a5e581614",
        startBlock: 9374751,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x25da9aa54dae4afa6534ba829c6288039d4f5ebb",
        startBlock: 9374756,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x4f1d36f2c1382a01006077a42de53f7c843d1a83",
        startBlock: 9374767,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x99e517db3db5ec5424367b8b50cd11ddcb0008f1",
        startBlock: 9374773,
      },
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: "0x7ab2947592c280542e680ba8f08a589009da8644",
        startBlock: 9447519,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xca7e6d0ddc5f373197bbe6fc2f09c2314399f028",
        startBlock: 9374764,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0x198827b2316e020c48b500fc3cebdbcaf58787ce",
        startBlock: 9374794,
      },

      //

      ETHRegistry: {
        abi: Registry,
        address: "0x89db31efa19c29c2510db56d8c213b3f960ca256",
        startBlock: 9685062,
      },
      RootRegistry: {
        abi: Registry,
        address: "0x52c3eec93cb33451985c29c1e3f80a40ab071360",
        startBlock: 9684796,
      },
      Registry: {
        abi: Registry,
        startBlock: 9684796,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9684796,
      },
    },
  },

  [DatasourceNames.Namechain]: {
    chain: sepolia,
    contracts: {
      Resolver: {
        abi: ResolverABI,
        startBlock: 9374708, // temporary: match same-network Resolver in ENSRoot above
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x0f3eb298470639a96bd548cea4a648bc80b2cee2",
        startBlock: 9683977,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x774faadcd7e8c4b7441aa2927f10845fea083ea1",
        startBlock: 9374809,
      },
      Registry: {
        abi: Registry,
        startBlock: 9374809,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9374809,
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
        address: "0xf7fca8d7b8b802d07a1011b69a5e39395197b730",
        startBlock: 9374772,
      },

      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0xa238d3aca667210d272391a119125d38816af4b1",
        startBlock: 9374791,
      },

      DefaultPublicResolver2: {
        abi: ResolverABI,
        address: "0x9c97031854a11e41289a33e2fa5749c468c08820",
        startBlock: 9374783,
      },
      DefaultPublicResolver3: {
        abi: ResolverABI,
        address: "0x0e14ee0592da66bb4c8a8090066bc8a5af15f3e6",
        startBlock: 9374784,
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
