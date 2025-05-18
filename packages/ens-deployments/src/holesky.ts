import { holesky } from "viem/chains";

import { ResolverConfig } from "./lib/resolver";
import { DatasourceName, type ENSDeployment } from "./lib/types";

import { ArgentWalletFactory as root_ArgentWalletFactory } from "./abis/root/ArgentWalletFactory";
import { ArgentWalletFactory2 as root_ArgentWalletFactory2 } from "./abis/root/ArgentWalletFactory2";
// ABIs for Root Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { EthRegistrarController as root_EthRegistrarController } from "./abis/root/EthRegistrarController";
import { EthRegistrarControllerOld as root_EthRegistrarControllerOld } from "./abis/root/EthRegistrarControllerOld";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";

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
        ...ResolverConfig,
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
      ArgentWalletFactory: {
        abi: root_ArgentWalletFactory,
        address: "0x851cC731ce1613AE4FD8EC7F61F4B350F9CE1020",
        startBlock: 0,
      },
      ArgentWalletFactory2: {
        abi: root_ArgentWalletFactory2,
        address: "0x40C84310Ef15B0c0E5c69d25138e0E16e8000fE9",
        startBlock: 0,
      },
    },
  },
  /**
   * The Holesky ENSDeployment has no known Datasource for Basenames or Lineanames.
   */
} satisfies ENSDeployment;
