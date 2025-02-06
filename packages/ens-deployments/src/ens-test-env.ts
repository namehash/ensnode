import { anvil } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

export default {
  eth: {
    // ens-test-env uses anvil with chain id 1337
    chain: { ...anvil, id: 1337 },

    // Addresses and Start Blocks from ens-test-env
    // https://github.com/ensdomains/ens-test-env/
    contracts: {
      RegistryOld: {
        address: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
      },
      Registry: {
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      },
      Resolver: {},
      BaseRegistrar: {
        address: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
      },
      EthRegistrarControllerOld: {
        address: "0xf5059a5D33d5853360D16C683c16e67980206f36",
      },
      EthRegistrarController: {
        address: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
      },
      NameWrapper: {
        address: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
      },
    },
  },
} satisfies ENSDeploymentConfig;
