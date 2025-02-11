import { mergeAbis } from "@ponder/utils";
import { anvil } from "viem/chains";

import { ETHResolverFilter } from "./filters";
import type { ENSDeploymentConfig } from "./types";

// Eth ABIs
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/eth/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/eth/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/eth/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/eth/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/eth/NameWrapper";
import { Registry as eth_Registry } from "./abis/eth/Registry";
import { Resolver as eth_Resolver } from "./abis/eth/Resolver";

/**
 * The "ENS deployment" configuration for 'ens-test-env'.
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export default {
  /**
   * Subregistry for direct subnames of 'eth' on the 'ens-test-env' "ENS deployment".
   */
  eth: {
    // ens-test-env runs on a local Anvil chain with id 1337
    chain: { ...anvil, id: 1337 },

    // Addresses and Start Blocks from ens-test-env
    // https://github.com/ensdomains/ens-test-env/
    // NOTE: no startBlocks, as a default of 0 is intentional for an Anvil chain
    contracts: {
      RegistryOld: {
        abi: eth_Registry,
        address: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
      },
      Registry: {
        abi: eth_Registry,
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      },
      Resolver: {
        abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
        filter: ETHResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
      },
      BaseRegistrar: {
        abi: eth_BaseRegistrar,
        address: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
      },
      EthRegistrarControllerOld: {
        abi: eth_EthRegistrarControllerOld,
        address: "0xf5059a5D33d5853360D16C683c16e67980206f36",
      },
      EthRegistrarController: {
        abi: eth_EthRegistrarController,
        address: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
      },
      NameWrapper: {
        abi: eth_NameWrapper,
        address: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
      },
    },
  },
  /**
   * On the 'ens-test-env' "ENS deployment" there is no known subregistry for direct
   * subnames of 'base.eth' or 'linea.eth'.
   */
} satisfies ENSDeploymentConfig;
