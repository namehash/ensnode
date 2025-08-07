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
        address: "0x94f523b8261B815b87EFfCf4d18E6aBeF18d6e4b",
        startBlock: 801536,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 801613,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 801536, // ignores any Resolver events prior to `startBlock` of RegistryOld on Holeksy
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 801686,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0xf13fC748601fDc5afA255e9D9166EB43f603a903",
        startBlock: 815355,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583",
        startBlock: 815359,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xFce6ce4373CB6E7e470EAa55329638acD9Dbd202",
        startBlock: 4027261,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xab50971078225D365994dc1Edcb9b7FD72Bb4862",
        startBlock: 815127,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xE3f3174Fc2F2B17644cD2dBaC3E47Bc82AE0Cf81",
        startBlock: 8515717,
      },
    },
  },
  /**
   * The Holesky ENS namespace has no known Datasource for Basenames or Lineanames.
   */
} satisfies ENSNamespace;
