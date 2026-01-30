import { zeroAddress } from "viem";

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
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ensTestEnvL1Chain, ensTestEnvL2Chain } from "./lib/chains";
// Shared ABIs
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

/**
 * The ens-test-env ENSNamespace
 *
 * 'ens-test-env' represents a deterministic deployment of the ENS protocol to a local Anvil chain
 * for development and testing.
 *
 * @see https://github.com/ensdomains/ens-test-env
 * @see https://github.com/ensdomains/namechain
 *
 * NOTE: The ens-test-env ENS namespace does not support Basenames, Lineanames, or 3DNS.
 * NOTE: The ens-test-env ENS namespace does not (yet) support ENSIP-19 Reverse Resolvers.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from Namechain devnet
   * https://github.com/ensdomains/namechain
   */
  [DatasourceNames.ENSRoot]: {
    chain: ensTestEnvL1Chain,
    contracts: {
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x0dcd1bf9a1b36ce34237eeafef220932846bcd82",
        startBlock: 0,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0xbec49fa140acaa83533fb00a2bb19bddd0290f25",
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xfbc22278a96299d91d41c453234d97b4f5eb9b2d",
        startBlock: 0,
      },
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xfd471836031dc5108809d173a067e8486b9047a3",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xdc11f7e700a4c898ae5caddb1082cffa76512add",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: ensTestEnvL1Chain,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: 0 },
      Registry: { abi: Registry, startBlock: 0 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 0 },
      RootRegistry: {
        abi: Registry,
        address: "0x9a676e781a523b5d0c0e43731313a708cb607508",
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x0b306bf915c4d645ff596e518faf3f9669b97016",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ENSv2ETHRegistry]: {
    chain: ensTestEnvL2Chain,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: 0 },
      Registry: { abi: Registry, startBlock: 0 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 0 },
      ETHRegistry: {
        abi: Registry,
        address: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvL1Chain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf",
        startBlock: 0,
      },

      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x5eb3bc0a489c5a8288765d2336659ebca68fcd00",
        startBlock: 0,
      },

      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x367761085bf3c12e5da2df99ac6e1a824612b8fb",
        startBlock: 0,
      },

      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0x4c2f7092c2ae51d986befee378e50bd4db99c901",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
