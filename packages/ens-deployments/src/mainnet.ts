import { base, linea, mainnet } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

export default {
  eth: {
    chain: mainnet,

    // Mainnet Addresses and Start Blocks from ENS Mainnet Subgraph Manifest
    // https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
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
  base: {
    chain: base,

    // Base Addresses and Start Blocks from Basenames
    // https://github.com/base-org/basenames
    contracts: {
      Registry: {
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        startBlock: 17571480,
      },
      Resolver: {
        startBlock: 17571480,
      },
      BaseRegistrar: {
        address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
        startBlock: 17571486,
      },
      EARegistrarController: {
        address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
        startBlock: 17575699,
      },
      RegistrarController: {
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
        address: "0x50130b669B28C339991d8676FA73CF122a121267",
        startBlock: 6682888,
      },
      Resolver: {
        startBlock: 6682888,
      },
      BaseRegistrar: {
        address: "0x6e84390dCc5195414eC91A8c56A5c91021B95704",
        startBlock: 6682892,
      },
      EthRegistrarController: {
        address: "0xDb75Db974B1F2bD3b5916d503036208064D18295",
        startBlock: 6682978,
      },
      NameWrapper: {
        address: "0xA53cca02F98D590819141Aa85C891e2Af713C223",
        startBlock: 6682956,
      },
    },
  },
} satisfies ENSDeploymentConfig;
