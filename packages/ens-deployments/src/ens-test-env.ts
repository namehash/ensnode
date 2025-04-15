import { mergeAbis } from "@ponder/utils";
import { anvil } from "viem/chains";

import { RootResolverFilter } from "./lib/filters";
import { DatasourceName, type ENSDeployment } from "./lib/types";

// ABIs for Root Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { EthRegistrarController as root_EthRegistrarController } from "./abis/root/EthRegistrarController";
import { EthRegistrarControllerOld as root_EthRegistrarControllerOld } from "./abis/root/EthRegistrarControllerOld";
import { LegacyPublicResolver as root_LegacyPublicResolver } from "./abis/root/LegacyPublicResolver";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { Resolver as root_Resolver } from "./abis/root/Resolver";

/**
 * The ens-test-env ENSDeployment
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
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
        address: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
        startBlock: 0,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        startBlock: 0,
      },
      Resolver: {
        abi: mergeAbis([root_LegacyPublicResolver, root_Resolver]),
        filter: RootResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
        startBlock: 0,
      },
      EthRegistrarControllerOld: {
        abi: root_EthRegistrarControllerOld,
        address: "0xf5059a5D33d5853360D16C683c16e67980206f36",
        startBlock: 0,
      },
      EthRegistrarController: {
        abi: root_EthRegistrarController,
        address: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
        startBlock: 0,
      },
    },
  },
  /**
   * The 'ens-test-env' ENSDeployment does not have a Basenames or LineaNames Datasource.
   */
} satisfies ENSDeployment;
