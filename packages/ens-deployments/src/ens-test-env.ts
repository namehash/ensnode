import { Address } from "viem";
import { anvil } from "viem/chains";

import { ResolverConfig } from "./lib/resolver";
import { DatasourceName, type ENSDeployment } from "./lib/types";

import { ArgentWalletFactory as root_ArgentWalletFactory } from "./abis/root/ArgentWalletFactory";
import { ArgentWalletFactory2 as root_ArgentWalletFactory2 } from "./abis/root/ArgentWalletFactory2";
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
 * The ens-test-env ENSDeployment
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for development of
 * ENS apps and running test suites against a deterministic deployment of the ENS protocol.
 * https://github.com/ensdomains/ens-test-env
 *
 * The 'ens-test-env' ENSDeployment is only relevant in the context of apps that use the ens-test-env
 * tool (i.e. ensjs and ens-app-v3) and it depends on the addresses of the contracts deployed by
 * that app (each app deploys the ENS protocol to slightly different addresses).
 *
 * In both ensjs and ens-app-v3, an env variable is available to the ens-test-env tool that
 * lists the addresses of each contract after deployment. These addresses are different in each
 * app and may change over time.
 *
 * If the addresses are not available in the environment, we use empty string as a mock to ensure
 * type-correctness: consumers of this ens-test-env deployment, if using outside of the context
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
  [DatasourceName.Root]: {
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
      ArgentWalletFactory: {
        abi: root_ArgentWalletFactory,
        address: "0x851cC731ce1613AE4FD8EC7F61F4B350F9CE1020",
        startBlock: 7086166,
      },
      ArgentWalletFactory2: {
        abi: root_ArgentWalletFactory2,
        address: "0x40C84310Ef15B0c0E5c69d25138e0E16e8000fE9",
        startBlock: 7086166,
      },
    },
  },
  /**
   * The 'ens-test-env' ENSDeployment does not have a Basenames or Lineanames Datasource.
   */
} satisfies ENSDeployment;
