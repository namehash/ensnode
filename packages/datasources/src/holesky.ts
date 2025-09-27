import { holesky } from "viem/chains";

import { DatasourceNames, type ENSNamespace } from "./lib/types";

// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";

// Shared ABIs
import { ResolverABI, ResolverFilter } from "./lib/resolver";

/**
 * The Holesky ENSNamespace
 *
 * NOTE: The Holesky ENS namespace has no known Datasource for Basenames, Lineanames, or 3DNS.
 * NOTE: The Holesky ENS namespace does not support ENSIP-19.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ENS Holesky Subgraph Manifest
   * https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
   */
  [DatasourceNames.ENSRoot]: {
    chain: holesky,
    contracts: {
      RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x94f523b8261b815b87effcf4d18e6abef18d6e4b",
        startBlock: 801536,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock: 801613,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 801536, // ignores any Resolver events prior to `startBlock` of RegistryOld on Holeksy
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        startBlock: 801686,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0xf13fc748601fdc5afa255e9d9166eb43f603a903",
        startBlock: 815355,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x179be112b24ad4cfc392ef8924dfa08c20ad8583",
        startBlock: 815359,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xfce6ce4373cb6e7e470eaa55329638acd9dbd202",
        startBlock: 4027261,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xab50971078225d365994dc1edcb9b7fd72bb4862",
        startBlock: 815127,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xe3f3174fc2f2b17644cd2dbac3e47bc82ae0cf81",
        startBlock: 8515717,
      },
    },
  },
} satisfies ENSNamespace;
