import { EnhancedAccessControl } from "./abis/namechain/EnhancedAccessControl";
import { Registry } from "./abis/namechain/Registry";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";
import { ensTestEnvL1Chain, ensTestEnvL2Chain } from "./lib/chains";
// Shared ABIs
import { ResolverABI } from "./lib/resolver";
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
        address: "0x610178da211fef7d417bc0e6fed39f05609ad788",
        startBlock: 0,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xa82ff9afd8f496c3d6ac40e2a0f282e47488cfc9",
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x5081a39b8a5f0e35a8d959395a630b68b74dd30f",
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x36b58f5c1969b7b6591d752ea6f5486d069010ab",
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
} satisfies ENSNamespace;
