import { zeroAddress } from "viem";

import { EnhancedAccessControl } from "./abis/namechain/EnhancedAccessControl";
import { Registry } from "./abis/namechain/Registry";
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
        address: "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0",
        startBlock: 0,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x0dcd1bf9a1b36ce34237eeafef220932846bcd82",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x851356ae760d987e095750cceb3bc6014560891c",
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x172076e0166d1f9cc711c77adf8488051744980c",
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xd84379ceae14aa33c123af12424a37803f885889",
        startBlock: 0,
      },
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x162a433068f51e18b7d13932f27e66a3f99e6890",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0x7a9ec1d04904907de0ed7b6839ccdd59c3716ac9",
        startBlock: 0,
      },

      //

      ETHTLDResolver: {
        abi: ResolverABI,
        address: "0x99bba657f2bbc93c02d617f8ba121cb8fc104acf",
        startBlock: 0,
      },

      RootRegistry: {
        abi: Registry,
        address: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
        startBlock: 0,
      },
      Registry: {
        abi: Registry,
        startBlock: 0,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.Namechain]: {
    chain: ensTestEnvL2Chain,
    contracts: {
      Registry: {
        abi: Registry,
        startBlock: 0,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
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

      DefaultPublicResolver2: {
        abi: ResolverABI,
        address: "0x367761085bf3c12e5da2df99ac6e1a824612b8fb",
        startBlock: 0,
      },

      DefaultPublicResolver3: {
        abi: ResolverABI,
        address: "0x4c2f7092c2ae51d986befee378e50bd4db99c901",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
