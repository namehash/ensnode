import { mergeAbis } from "ponder";
import { anvil } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

// eth plugin abis
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/eth/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/eth/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/eth/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/eth/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/eth/NameWrapper";
import { Registry as eth_Registry } from "./abis/eth/Registry";
import { Resolver as eth_Resolver } from "./abis/eth/Resolver";

export default {
  eth: {
    chain: anvil,

    // Addresses and Start Blocks from ens-test-env
    contracts: {
      RegistryOld: {
        abi: eth_Registry,
        address: "0x314159265dd8dbb310642f98f50c066173c1259b",
        startBlock: 3327417,
      },
      Registry: {
        abi: eth_Registry,
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 9380380,
      },
      Resolver: {
        abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
        // NOTE: this indexes every event ever emitted that looks like this
        filter: [
          { event: "AddrChanged", args: {} },
          { event: "AddressChanged", args: {} },
          { event: "NameChanged", args: {} },
          { event: "ABIChanged", args: {} },
          { event: "PubkeyChanged", args: {} },
          {
            event: "TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
            args: {},
          },
          {
            event:
              "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
            args: {},
          },
          { event: "ContenthashChanged", args: {} },
          { event: "InterfaceChanged", args: {} },
          { event: "AuthorisationChanged", args: {} },
          { event: "VersionChanged", args: {} },
          { event: "DNSRecordChanged", args: {} },
          { event: "DNSRecordDeleted", args: {} },
          { event: "DNSZonehashChanged", args: {} },
        ],
        startBlock: 3327417,
      },
      BaseRegistrar: {
        abi: eth_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 9380410,
      },
      EthRegistrarControllerOld: {
        abi: eth_EthRegistrarControllerOld,
        address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
        startBlock: 9380471,
      },
      EthRegistrarController: {
        abi: eth_EthRegistrarController,
        address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
        startBlock: 16925618,
      },
      NameWrapper: {
        abi: eth_NameWrapper,
        address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
        startBlock: 16925608,
      },
    },
  },
} satisfies ENSDeploymentConfig;
