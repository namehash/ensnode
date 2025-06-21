import { Address } from "viem";
import { anvil } from "viem/chains";

import { ResolverConfig } from "./lib/resolver";
import { type DatasourceMap, DatasourceNames } from "./lib/types";

// ABIs for Root Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { EthRegistrarController as root_EthRegistrarController } from "./abis/root/EthRegistrarController";
import { EthRegistrarControllerOld as root_EthRegistrarControllerOld } from "./abis/root/EthRegistrarControllerOld";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { getENSTestEnvDeploymentAddresses } from "./lib/ens-test-env-deployment-addresses";

const deploymentAddresses = getENSTestEnvDeploymentAddresses();

const EMPTY_ADDRESS = "" as Address;

/**
 * Datasources for the ens-test-env ENS namespace
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
   * Root Datasource
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
        ...ResolverConfig,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: deploymentAddresses?.BaseRegistrarImplementation ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      EthRegistrarControllerOld: {
        abi: root_EthRegistrarControllerOld,
        address: deploymentAddresses?.LegacyETHRegistrarController ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      EthRegistrarController: {
        abi: root_EthRegistrarController,
        address: deploymentAddresses?.ETHRegistrarController ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: deploymentAddresses?.NameWrapper ?? EMPTY_ADDRESS,
        startBlock: 0,
      },
    },
  },
  /**
   * The 'ens-test-env' ENS namespace does not have any other Datasources.
   */
} satisfies DatasourceMap;
