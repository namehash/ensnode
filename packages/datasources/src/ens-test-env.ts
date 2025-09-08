import { anvil } from "viem/chains";

import { DatasourceNames, type ENSNamespace } from "./lib/types";

// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";

// Shared ABIs
import { ResolverABI, ResolverFilter } from "./lib/resolver";

/**
 * The ens-test-env ENSNamespace
 *
 * 'ens-test-env' represents an ENS namespace running on a local Anvil chain for development of
 * ENS apps and running test suites against a deterministic deployment of the ENS protocol.
 * https://github.com/ensdomains/ens-test-env
 *
 * These 'ens-test-env' Datasources are only relevant in the context of apps that use the ens-test-env
 * tool (i.e. ensjs and ens-app-v3) and it depends on the addresses of the contracts deployed by
 * that app (each app deploys the ENS protocol to slightly different addresses).
 *
 * In both ensjs and ens-app-v3, an env variable is available to the ens-test-env tool that
 * lists the addresses of each contract after deployment. These addresses are different in each
 * app and may change over time.
 *
 * If the addresses are not available in the environment, we use empty string as a mock to ensure
 * type-correctness: consumers of these ens-test-env Datasources, if using outside of the context
 * of the ens-test-env tool, should validate that an Address is provided, or they may experience
 * undefined runtime behavior.
 *
 * NOTE: The ens-test-env ENS namespace does not support Basenames, Lineanames, or 3DNS.
 * NOTE: The ens-test-env ENS namespace does not support ENSIP-19 Reverse Resolvers.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ens-test-env
   * https://github.com/ensdomains/ens-test-env/
   */
  [DatasourceNames.ENSRoot]: {
    // ens-test-env runs on a local Anvil chain with id 1337
    chain: { ...anvil, id: 1337 },
    contracts: {
      RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
        startBlock: 0,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9",
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f",
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x36b58F5C1969B7b6591D752ea6F5486D069010AB",
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xD84379CEae14AA33C123Af12424A37803F885889",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
