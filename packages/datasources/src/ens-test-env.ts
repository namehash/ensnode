import { zeroAddress } from "viem";

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
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ensTestEnvChain } from "./lib/chains";
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
 * @see https://github.com/ensdomains/contracts-v2
 *
 * NOTE: The ens-test-env ENS namespace does not support Basenames, Lineanames, or 3DNS.
 * NOTE: The ens-test-env ENS namespace does not (yet) support ENSIP-19 Reverse Resolvers.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ENSv2 devnet
   * https://github.com/ensdomains/contracts-v2
   */
  [DatasourceNames.ENSRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      // NOTE: named LegacyENSRegistry in devnet
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      },
      // NOTE: named ENSRegistry in devnet
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      // NOTE: named BaseRegistrarImplementation in devnet
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
        startBlock: 0,
      },
      // NOTE: named LegacyETHRegistrarController in devnet
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0xfbc22278a96299d91d41c453234d97b4f5eb9b2d",
        startBlock: 0,
      },
      // NOTE: named WrappedETHRegistrarController in devnet
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      // NOTE: named ETHRegistrarController in devnet
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x1c85638e118b37167e9298c2268758e058ddfda0",
        startBlock: 0,
      },
      // NOTE: not in devnet, set to zeroAddress
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x5081a39b8a5f0e35a8d959395a630b68b74dd30f",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: UniversalResolverV1,
        address: "0x5067457698fd6fa1c6964e416b3f42713513b3dd",
        startBlock: 0,
      },
      // NOTE: named UniversalResolverV2 in devnet
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: "0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: ensTestEnvChain,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: 0 },
      Registry: { abi: Registry, startBlock: 0 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 0 },
      RootRegistry: {
        abi: Registry,
        address: "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6",
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf",
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x4c4a2f8c81640e47606d3fd77b353e87ba015584",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x4c5859f0f772848b2d91f1d83e2fe57935348029",
        startBlock: 0,
      },

      // NOTE: named DefaultReverseResolver in devnet
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154",
        startBlock: 0,
      },

      // NOTE: named LegacyPublicResolver in devnet
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d",
        startBlock: 0,
      },

      // NOTE: named PublicResolver in devnet
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0xa4899d35897033b927acfcf422bc745916139776",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
