import { mergeAbis } from "@ponder/utils";
import { holesky } from "viem/chains";

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
 * The "ENS deployment" configuration for 'holesky'.
 */
export default {
  /**
   * Subregistry for direct subnames of 'eth' on the Holesky "ENS deployment".
   */
  eth: {
    chain: holesky,

    // Addresses and Start Blocks from ENS Holesky Subgraph Manifest
    // https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
    contracts: {
      RegistryOld: {
        abi: eth_Registry,
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 801536,
      },
      Registry: {
        abi: eth_Registry,
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 801613,
      },
      Resolver: {
        abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
        filter: ETHResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 801536, // based on startBlock of RegistryOld on Holeksy
      },
      BaseRegistrar: {
        abi: eth_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 801686,
      },
      EthRegistrarControllerOld: {
        abi: eth_EthRegistrarControllerOld,
        address: "0xf13fC748601fDc5afA255e9D9166EB43f603a903",
        startBlock: 815355,
      },
      EthRegistrarController: {
        abi: eth_EthRegistrarController,
        address: "0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583",
        startBlock: 815359,
      },
      NameWrapper: {
        abi: eth_NameWrapper,
        address: "0xab50971078225D365994dc1Edcb9b7FD72Bb4862",
        startBlock: 815127,
      },
    },
  },
  /**
   * On the Holesky "ENS deployment" there is no known subregistry for direct
   * subnames of 'base.eth' or 'linea.eth'.
   */
} satisfies ENSDeploymentConfig;
