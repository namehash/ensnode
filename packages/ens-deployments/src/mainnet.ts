import { base, linea, mainnet } from "viem/chains";

import { BaseResolverFilter, ETHResolverFilter, LineaResolverFilter } from "./filters";
import type { ENSDeploymentConfig } from "./types";

/**
 * The "ENS deployment" configuration for 'mainnet'.
 */
export default {
  /**
   * Subregistry for direct subnames of 'eth' on the mainnet "ENS deployment".
   */
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
        filter: ETHResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 3327417, // based on startBlock of RegistryOld on Mainnet
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

  /**
   * Subregistry for direct subnames of 'base.eth' on the mainnet "ENS deployment".
   */
  base: {
    /**
     * As of 9-Feb-2025 the Resolver for 'base.eth' in the mainnet "ENS deployment" is
     * 0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'base.eth' to an offchain
     * gateway server operated by Coinbase that uses the following subregistry contracts on
     * Base as its source of truth.
     *
     * The owner of 'base.eth' in the ENS Registry on the mainnet "ENS deployment"
     * (e.g. Coinbase) has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: base,

    // Base Addresses and Start Blocks from Basenames
    // https://github.com/base-org/basenames
    contracts: {
      Registry: {
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        startBlock: 17571480,
      },
      Resolver: {
        filter: BaseResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 17571480, // based on startBlock of Registry on Base
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

  /**
   * Subregistry for direct subnames of 'linea.eth' on the mainnet "ENS deployment".
   */
  linea: {
    /**
     * As of 9-Feb-2025 the Resolver for 'linea.eth' in the mainnet "ENS deployment" is
     * 0xde16ee87B0C019499cEBDde29c9F7686560f679a.
     *
     * This Resolver uses ENSIP-10 (Wildcard Resolution) and EIP-3668 (CCIP Read) to delegate
     * the forward resolution of data associated with subnames of 'linea.eth' to an offchain
     * gateway server operated by Consensys that uses the following subregistry contracts on
     * Linea as its source of truth.
     *
     * The owner of 'linea.eth' in the ENS Registry on the mainnet "ENS deployment"
     * (e.g. Consensys) has the ability to change this configuration at any time.
     *
     * See the reference documentation for additional context:
     * docs/ensnode/src/content/docs/reference/mainnet-registered-subnames-of-subregistries.mdx
     */
    chain: linea,

    // Linea Addresses and Start Blocks from Linea ENS
    // https://github.com/Consensys/linea-ens
    contracts: {
      Registry: {
        address: "0x50130b669B28C339991d8676FA73CF122a121267",
        startBlock: 6682888,
      },
      Resolver: {
        filter: LineaResolverFilter, // NOTE: a Resolver is any contract that matches this `filter`
        startBlock: 6682888, // based on startBlock of Registry on Linea
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
