import { mergeAbis } from "ponder";
import { base, linea, mainnet } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

// eth plugin abis
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/eth/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/eth/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/eth/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/eth/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/eth/NameWrapper";
import { Registry as eth_Registry } from "./abis/eth/Registry";
import { Resolver as eth_Resolver } from "./abis/eth/Resolver";

// base plugin abis
import { BaseRegistrar as base_BaseRegistrar } from "./abis/base/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EarlyAccessRegistrarController } from "./abis/base/EARegistrarController";
import { L2Resolver as base_L2Resolver } from "./abis/base/L2Resolver";
import { RegistrarController as base_RegistrarController } from "./abis/base/RegistrarController";
import { Registry as base_Registry } from "./abis/base/Registry";

// linea plugin abis
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/linea/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/linea/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/linea/NameWrapper";
import { Registry as linea_Registry } from "./abis/linea/Registry";
import { Resolver as linea_Resolver } from "./abis/linea/Resolver";

export default {
  eth: {
    chain: mainnet,

    // Mainnet Addresses and Start Blocks from ENS Mainnet Subgraph Manifest
    // https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
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
  base: {
    chain: base,

    // Base Addresses and Start Blocks from Basenames
    // https://github.com/base-org/basenames
    contracts: {
      Registry: {
        abi: base_Registry,
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        startBlock: 17571480,
      },
      Resolver: {
        abi: base_L2Resolver,
        filter: [
          { event: "AddrChanged", args: {} },
          { event: "AddressChanged", args: {} },
          { event: "NameChanged", args: {} },
          { event: "ABIChanged", args: {} },
          { event: "PubkeyChanged", args: {} },
          { event: "TextChanged", args: {} },
          { event: "ContenthashChanged", args: {} },
          { event: "InterfaceChanged", args: {} },
          { event: "VersionChanged", args: {} },
          { event: "DNSRecordChanged", args: {} },
          { event: "DNSRecordDeleted", args: {} },
          { event: "DNSZonehashChanged", args: {} },
        ],
        startBlock: 17571480,
      },
      BaseRegistrar: {
        abi: base_BaseRegistrar,
        address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
        startBlock: 17571486,
      },
      EARegistrarController: {
        abi: base_EarlyAccessRegistrarController,
        address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
        startBlock: 17575699,
      },
      RegistrarController: {
        abi: base_RegistrarController,
        address: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5",
        startBlock: 18619035,
      },
    },
  },
  linea: {
    chain: linea,

    // Linea Addresses and Start Blocks from Linea ENS
    // https://github.com/Consensys/linea-ens
    contracts: {
      Registry: {
        abi: linea_Registry,
        address: "0x50130b669B28C339991d8676FA73CF122a121267",
        startBlock: 6682888,
      },
      Resolver: {
        abi: linea_Resolver,
        filter: [
          { event: "AddrChanged", args: {} },
          { event: "AddressChanged", args: {} },
          { event: "NameChanged", args: {} },
          { event: "ABIChanged", args: {} },
          { event: "PubkeyChanged", args: {} },
          { event: "TextChanged", args: {} },
          { event: "ContenthashChanged", args: {} },
          { event: "InterfaceChanged", args: {} },
          { event: "VersionChanged", args: {} },
          { event: "DNSRecordChanged", args: {} },
          { event: "DNSRecordDeleted", args: {} },
          { event: "DNSZonehashChanged", args: {} },
        ],
        startBlock: 6682888,
      },
      BaseRegistrar: {
        abi: linea_BaseRegistrar,
        address: "0x6e84390dCc5195414eC91A8c56A5c91021B95704",
        startBlock: 6682892,
      },
      EthRegistrarController: {
        abi: linea_EthRegistrarController,
        address: "0xDb75Db974B1F2bD3b5916d503036208064D18295",
        startBlock: 6682978,
      },
      NameWrapper: {
        abi: linea_NameWrapper,
        address: "0xA53cca02F98D590819141Aa85C891e2Af713C223",
        startBlock: 6682956,
      },
    },
  },
} satisfies ENSDeploymentConfig;
