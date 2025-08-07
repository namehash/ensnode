import { Address, zeroAddress } from "viem";
import { anvil } from "viem/chains";

import { getENSTestEnvDeploymentAddresses } from "./lib/ens-test-env-deployment-addresses";
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

const deploymentAddresses = getENSTestEnvDeploymentAddresses();

const EMPTY_ADDRESS = "" as Address;

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
        address: deploymentAddresses?.LegacyENSRegistry ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: deploymentAddresses?.ENSRegistry ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: deploymentAddresses?.BaseRegistrarImplementation ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address:
          // NOTE: prefer the post-UnwrappedEthRegistrarController naming
          deploymentAddresses?.LegacyETHRegistrarController ??
          // TODO: remove deploymentAddresses?.ETHRegistrarControllerOld after ens-test-env is updated
          deploymentAddresses?.ETHRegistrarControllerOld ??
          EMPTY_ADDRESS,
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address:
          // NOTE: prefer the post-UnwrappedEthRegistrarController naming
          deploymentAddresses?.WrappedETHRegistrarController ??
          // TODO: remove deploymentAddresses?.ETHRegistrarController after ens-test-env is updated
          deploymentAddresses?.ETHRegistrarController ??
          EMPTY_ADDRESS,
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        // TODO: once ens-test-env is updated with the new UnwrappedEthRegistrarController, update
        // this reference here
        // NOTE: using zeroAddress so indexing proceeds as expected in ens-test-env pre-UnwrappedEthRegistrarController
        // TODO: change zeroAddress to EMPTY_ADDRESS after ens-test-env is updated
        address: deploymentAddresses?.UnwrappedETHRegistrarController ?? zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: deploymentAddresses?.NameWrapper ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: deploymentAddresses?.UniversalResolver ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
    },
  },
  /**
   * The 'ens-test-env' ENS namespace does not have any other Datasources.
   */
} satisfies ENSNamespace;
