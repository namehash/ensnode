import { mergeAbis } from "@ponder/utils";
import { holesky } from "viem/chains";

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
 * The Holesky ENSDeployment
 */
export default {
  /**
   * Root Datasource
   *
   * Addresses and Start Blocks from ENS Holesky Subgraph Manifest
   * https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
   */
  [DatasourceName.Root]: {
    chain: holesky,
    contracts: {
      RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 801536,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 801613,
      },
      Resolver: {
        abi: mergeAbis([root_LegacyPublicResolver, root_Resolver]),
        filter: RootResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 801536, // ignores any Resolver events prior to `startBlock` of RegistryOld on Holeksy
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 801686,
      },
      EthRegistrarControllerOld: {
        abi: root_EthRegistrarControllerOld,
        address: "0xf13fC748601fDc5afA255e9D9166EB43f603a903",
        startBlock: 815355,
      },
      EthRegistrarController: {
        abi: root_EthRegistrarController,
        address: "0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583",
        startBlock: 815359,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xab50971078225D365994dc1Edcb9b7FD72Bb4862",
        startBlock: 815127,
      },
    },
  },
  /**
   * The Holesky ENSDeployment has no known Datasource for Basenames or Lineanames.
   */
} satisfies ENSDeployment;
