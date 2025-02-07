import { holesky } from "viem/chains";

import type { ENSDeploymentConfig } from "./types";

export default {
  eth: {
    chain: holesky,

    // Addresses and Start Blocks from ENS Holesky Subgraph Manifest
    // https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
    contracts: {
      RegistryOld: {
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 801536,
      },
      Registry: {
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 801613,
      },
      Resolver: {
        // NOTE: no address, events identified by `ContractConfig#filter`
        startBlock: 801536,
      },
      BaseRegistrar: {
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 801686,
      },
      EthRegistrarControllerOld: {
        address: "0xf13fC748601fDc5afA255e9D9166EB43f603a903",
        startBlock: 815355,
      },
      EthRegistrarController: {
        address: "0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583",
        startBlock: 815359,
      },
      NameWrapper: {
        address: "0xab50971078225D365994dc1Edcb9b7FD72Bb4862",
        startBlock: 815127,
      },
    },
  },
} satisfies ENSDeploymentConfig;
