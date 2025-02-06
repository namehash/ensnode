import { anvil } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

export default {
  eth: {
    chain: anvil,

    // Addresses and Start Blocks from ens-test-env
    // https://github.com/ensdomains/ens-test-env/
    contracts: {
      RegistryOld: {
        address: "0x314159265dd8dbb310642f98f50c066173c1259b",
        startBlock: 3327417,
      },
      Registry: {
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 9380380,
      },
      Resolver: {
        startBlock: 3327417,
      },
      BaseRegistrar: {
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 9380410,
      },
      EthRegistrarControllerOld: {
        address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
        startBlock: 9380471,
      },
      EthRegistrarController: {
        address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
        startBlock: 16925618,
      },
      NameWrapper: {
        address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
        startBlock: 16925608,
      },
    },
  },
} satisfies ENSDeploymentConfig;
