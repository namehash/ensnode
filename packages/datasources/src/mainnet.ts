import { base, linea, mainnet, optimism } from "viem/chains";

import { DatasourceNames, type ENSNamespace } from "./lib/types";

// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { EthRegistrarController as root_EthRegistrarController } from "./abis/root/EthRegistrarController";
import { EthRegistrarControllerOld as root_EthRegistrarControllerOld } from "./abis/root/EthRegistrarControllerOld";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";

// ABIs for Basenames Datasource
import { BaseRegistrar as base_BaseRegistrar } from "./abis/basenames/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EARegistrarController } from "./abis/basenames/EARegistrarController";
import { RegistrarController as base_RegistrarController } from "./abis/basenames/RegistrarController";
import { Registry as base_Registry } from "./abis/basenames/Registry";

// ABIs for Lineanames Datasource
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/lineanames/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/lineanames/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/lineanames/NameWrapper";
import { Registry as linea_Registry } from "./abis/lineanames/Registry";
import { ThreeDNSToken } from "./abis/threedns/ThreeDNSToken";
import { ResolverConfig } from "./lib/resolver";

// ABIs for the EFP Datasource
import EFPListRegistry from "./abis/efp/EFPListRegistry";

/**
 * The Mainnet ENSNamespace
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ENS Mainnet Subgraph Manifest
   * https://ipfs.io/ipfs/Qmd94vseLpkUrSFvJ3GuPubJSyHz8ornhNrwEAt6pjcbex
   */
  [DatasourceNames.ENSRoot]: {
    chain: mainnet,
    contracts: {
      RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x314159265dd8dbb310642f98f50c066173c1259b",
        startBlock: 3327417,
      },
      Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 9380380,
      },
      Resolver: {
        ...ResolverConfig,
        startBlock: 3327417, // ignores any Resolver events prior to `startBlock` of RegistryOld on Mainnet
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 9380410,
      },
      EthRegistrarControllerOld: {
        abi: root_EthRegistrarControllerOld,
        address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
        startBlock: 9380471,
      },
      EthRegistrarController: {
        abi: root_EthRegistrarController,
        address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
        startBlock: 16925618,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
        startBlock: 16925608,
      },
    },
  },

  /**
   * Basenames Datasource
   *
   * Addresses and Start Blocks from Basenames
   * https://github.com/base-org/basenames
   */
  [DatasourceNames.Basenames]: {
    /**
     * As of 9-Feb-2025 the Resolver for 'base.eth' in the mainnet ENS namespace is
     * 0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'base.eth' to an offchain
     * gateway server operated by Coinbase that uses the following subregistry contracts on
     * Base as its source of truth.
     *
     * The owner of 'base.eth' in the ENS Registry in the mainnet ENS namespace (e.g. Coinbase)
     * has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: base,
    contracts: {
      Registry: {
        abi: base_Registry,
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        startBlock: 17571480,
      },
      Resolver: {
        ...ResolverConfig,
        startBlock: 17571480, // based on startBlock of Registry on Base
      },
      BaseRegistrar: {
        abi: base_BaseRegistrar,
        address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
        startBlock: 17571486,
      },
      EARegistrarController: {
        abi: base_EARegistrarController,
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

  /**
   * Lineanames Datasource
   *
   * Addresses and Start Blocks from Lineanames
   * https://github.com/Consensys/linea-ens
   */
  [DatasourceNames.Lineanames]: {
    /**
     * As of 9-Feb-2025 the Resolver for 'linea.eth' in the mainnet ENS namespace is
     * 0xde16ee87B0C019499cEBDde29c9F7686560f679a.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'linea.eth' to an offchain
     * gateway server operated by Consensys that uses the following subregistry contracts on
     * Linea as its source of truth.
     *
     * The owner of 'linea.eth' in the ENS Registry in the mainnet ENS namespace (e.g. Consensys)
     * has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: linea,
    contracts: {
      Registry: {
        abi: linea_Registry,
        address: "0x50130b669B28C339991d8676FA73CF122a121267",
        startBlock: 6682888,
      },
      Resolver: {
        ...ResolverConfig,
        startBlock: 6682888, // based on startBlock of Registry on Linea
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

  /**
   * The 3DNS Datasource on Optimism.
   * https://opensea.io/collection/3dns-powered-domains
   */
  [DatasourceNames.ThreeDNSOptimism]: {
    chain: optimism,
    contracts: {
      ThreeDNSToken: {
        abi: ThreeDNSToken,
        address: "0xBB7B805B257d7C76CA9435B3ffe780355E4C4B17",
        startBlock: 110393959,
      },
      Resolver: {
        abi: ResolverConfig.abi,
        // NOTE: 3DNSToken on Optimism has a hardcoded protocol-wide Resolver at this address
        address: "0xF97aAc6C8dbaEBCB54ff166d79706E3AF7a813c8",
        startBlock: 110393959,
      },
    },
  },

  /**
   * The 3DNS Datasource on Base.
   * https://opensea.io/collection/3dns-powered-domains-base
   */
  [DatasourceNames.ThreeDNSBase]: {
    chain: base,
    contracts: {
      ThreeDNSToken: {
        abi: ThreeDNSToken,
        address: "0xBB7B805B257d7C76CA9435B3ffe780355E4C4B17",
        startBlock: 17522624,
      },
      Resolver: {
        abi: ResolverConfig.abi,
        // NOTE: 3DNSToken on Base has a hardcoded protocol-wide Resolver at this address
        address: "0xF97aAc6C8dbaEBCB54ff166d79706E3AF7a813c8",
        startBlock: 17522624,
      },
    },
  },

  /**
   * The Root EFP Datasource.
   * Based on the list of EFP deployments:
   * https://docs.efp.app/production/deployments/
   */
  [DatasourceNames.EFPRoot]: {
    chain: base,
    contracts: {
      EFPListRegistry: {
        abi: EFPListRegistry,
        address: "0x0E688f5DCa4a0a4729946ACbC44C792341714e08",
        startBlock: 20197231,
      },
    },
  },
} satisfies ENSNamespace;
