import { arbitrum, base, linea, mainnet, optimism, scroll } from "viem/chains";

import { DatasourceNames, type ENSNamespace } from "./lib/types";

// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";

// ABIs for Basenames Datasource
import { BaseRegistrar as base_BaseRegistrar } from "./abis/basenames/BaseRegistrar";
import { EarlyAccessRegistrarController as base_EARegistrarController } from "./abis/basenames/EARegistrarController";
import { RegistrarController as base_RegistrarController } from "./abis/basenames/RegistrarController";
import { Registry as base_Registry } from "./abis/basenames/Registry";
import { UpgradeableRegistrarController as base_UpgradeableRegistrarController } from "./abis/basenames/UpgradeableRegistrarController";

// ABIs for Lineanames Datasource
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/lineanames/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/lineanames/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/lineanames/NameWrapper";
import { Registry as linea_Registry } from "./abis/lineanames/Registry";
import { ThreeDNSToken } from "./abis/threedns/ThreeDNSToken";

import { Seaport as Seaport1_5 } from "./abis/seaport/Seaport1.5";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI, ResolverFilter } from "./lib/resolver";

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
        address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        startBlock: 9380380,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 3327417, // ignores any Resolver events prior to `startBlock` of RegistryOld on Mainnet
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        startBlock: 9380410,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
        startBlock: 9380471,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 16925618,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        startBlock: 22764821,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
        startBlock: 16925608,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xabd80e8a13596feea40fd26fd6a24c3fe76f05fb",
        startBlock: 22671701,
      },
      BasenamesL1Resolver: {
        abi: ResolverABI,
        address: "0xde9049636f4a1dfe0a64d1bfe3155c0a14c54f31",
        startBlock: 20420641,
      },
      LineanamesL1Resolver: {
        abi: ResolverABI,
        address: "0xde16ee87b0c019499cebdde29c9f7686560f679a",
        startBlock: 20410692,
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
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 17571480, // based on startBlock of Registry on Base
      },
      BaseRegistrar: {
        abi: base_BaseRegistrar,
        address: "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a",
        startBlock: 17571486,
      },
      EARegistrarController: {
        abi: base_EARegistrarController,
        address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
        startBlock: 17575699,
      },
      RegistrarController: {
        /**
         * This controller was removed from BaseRegistrar contract
         * https://basescan.org/tx/0x88a3cc03291bb1a4b2bd9ccfe6b770988470001905d96c32bd41b866797b684b
         */
        abi: base_RegistrarController,
        address: "0x4ccb0bb02fcaba27e82a56646e81d8c5bc4119a5",
        startBlock: 18619035,
        endBlock: 35936564,
      },
      UpgradeableRegistrarController: {
        /**
         * This controller was added to BaseRegistrar contract
         * with the following tx:
         * https://basescan.org/tx/0x52aed4dc975ba6c2b8b54d94f5b0b86a9cc0f27e81e78deb4a0b8b568f5e71ed
         */
        abi: base_UpgradeableRegistrarController,
        address: "0xa7d2607c6BD39Ae9521e514026CBB078405Ab322", // a proxy contract
        startBlock: 35286620,
      },
      L2Resolver: {
        abi: ResolverABI,
        address: "0xc6d566a56a1aff6508b41f6c90ff131615583bcd",
        startBlock: 17575714,
      },
      UpgradeableL2Resolver: {
        abi: ResolverABI,
        address: "0x426fA03fB86E510d0Dd9F70335Cf102a98b10875",
        startBlock: 35286620,
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
        address: "0x50130b669b28c339991d8676fa73cf122a121267",
        startBlock: 6682888,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 6682888, // based on startBlock of Registry on Linea
      },
      BaseRegistrar: {
        abi: linea_BaseRegistrar,
        address: "0x6e84390dcc5195414ec91a8c56a5c91021b95704",
        startBlock: 6682892,
      },
      EthRegistrarController: {
        abi: linea_EthRegistrarController,
        address: "0xdb75db974b1f2bd3b5916d503036208064d18295",
        startBlock: 6682978,
      },
      NameWrapper: {
        abi: linea_NameWrapper,
        address: "0xa53cca02f98d590819141aa85c891e2af713c223",
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
        address: "0xbb7b805b257d7c76ca9435b3ffe780355e4c4b17",
        startBlock: 110393959,
      },
      Resolver: {
        abi: ResolverABI,
        // NOTE: 3DNSToken on Optimism has a hardcoded protocol-wide Resolver at this address
        address: "0xf97aac6c8dbaebcb54ff166d79706e3af7a813c8",
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
        address: "0xbb7b805b257d7c76ca9435b3ffe780355e4c4b17",
        startBlock: 17522624,
      },
      Resolver: {
        abi: ResolverABI,
        // NOTE: 3DNSToken on Base has a hardcoded protocol-wide Resolver at this address
        address: "0xf97aac6c8dbaebcb54ff166d79706e3af7a813c8",
        startBlock: 17522624,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on the ENS Root chain.
   */
  [DatasourceNames.ReverseResolverRoot]: {
    chain: mainnet,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x283f227c4bd38ece252c4ae7ece650b0e913f1f9",
        startBlock: 22764819,
      },

      // NOTE: the DefaultReverseResolver1 (aka LegacyDefaultReverseResolver) does NOT emit events
      // and is effectively unindexable for the purposes of Reverse Resolution. We document it here
      // for completeness, but/and explicity do not index it.
      DefaultReverseResolver1: {
        abi: ResolverABI,
        address: "0xa2c122be93b0074270ebee7f6b7292c7deb45047",
        startBlock: 9380501,
      },

      // this DefaultReverseResolver was enabled in the following proposal:
      // https://discuss.ens.domains/t/ep3-5-executable-activate-new-eth-controller-and-reverse-registrar/16776
      // https://www.tally.xyz/gov/ens/proposal/42973781582803845389836855775840822719678533376883030929209752909248937768242
      // DefaultReverseResolver2 is the pre-ENSIP-19 DefaultReverseResolver and it emits
      // Resolver#NameChanged events. We index these events to power aspects of Protocol Acceleration.
      DefaultReverseResolver2: {
        abi: ResolverABI,
        address: "0x231b0ee14048e9dccd1d247744d114a4eb5e8e63",
        startBlock: 16925619,
      },

      // this DefaultReverseResolver was enabled in the following proposal:
      // https://discuss.ens.domains/t/executable-enable-l2-reverse-registrars-and-new-eth-registrar-controller/20969
      // https://www.tally.xyz/gov/ens/proposal/42524979896803285837776370636134389407867034021879791462477783237030656381157
      // NOTE: DefaultReverseResolver3 is not directly indexed: it simply reads data from
      // DefaultReverseRegistrar, which IS indexed. We document it here for completeness.
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0xa7d635c8de9a58a228aa69353a1699c7cc240dcf",
        startBlock: 22764871,
      },

      // the original default public resolver aka LegacyPublicResolver
      // it uses a TextChanged event that does not include the `value` parameter
      DefaultPublicResolver1: {
        abi: ResolverABI,
        address: "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41",
        startBlock: 9412610,
      },

      // this PublicResolver was enabled in the following proposal:
      // https://discuss.ens.domains/t/ep3-5-executable-activate-new-eth-controller-and-reverse-registrar/16776
      // https://www.tally.xyz/gov/ens/proposal/42973781582803845389836855775840822719678533376883030929209752909248937768242
      DefaultPublicResolver2: {
        abi: ResolverABI,
        address: "0x231b0ee14048e9dccd1d247744d114a4eb5e8e63",
        startBlock: 16925619,
      },

      // this PublicResolver was enabled in the following proposal
      // https://discuss.ens.domains/t/executable-enable-l2-reverse-registrars-and-new-eth-registrar-controller/20969
      // https://www.tally.xyz/gov/ens/proposal/42524979896803285837776370636134389407867034021879791462477783237030656381157
      DefaultPublicResolver3: {
        abi: ResolverABI,
        address: "0xf29100983e058b709f3d539b0c765937b804ac15",
        startBlock: 22764828,
      },

      BaseReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#80002105.reverse
        address: "0xc800dbc8ff9796e58efba2d7b35028ddd1997e5e",
        startBlock: 22764838,
      },

      LineaReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000e708.reverse
        address: "0x0ce08a41bdb10420fb5cac7da8ca508ea313aef8",
        startBlock: 22764840,
      },

      OptimismReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000000a.reverse
        address: "0xf9edb1a21867ac11b023ce34abad916d29abf107",
        startBlock: 22764854,
      },

      ArbitrumReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000a4b1.reverse
        address: "0x4b9572c03aaa8b0efa4b4b0f0cc0f0992bedb898",
        startBlock: 22764837,
      },

      ScrollReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#80082750.reverse
        address: "0xc4842814ca523e481ca5aa85f719fed1e9cac614",
        startBlock: 22921284,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Base.
   */
  [DatasourceNames.ReverseResolverBase]: {
    chain: base,
    contracts: {
      L2ReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x0000000000d8e504002cc26e3ec46d81971c1664",
        startBlock: 31808582,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Linea.
   */
  [DatasourceNames.ReverseResolverLinea]: {
    chain: linea,
    contracts: {
      L2ReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x0000000000d8e504002cc26e3ec46d81971c1664",
        startBlock: 20173340,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Optimism.
   */
  [DatasourceNames.ReverseResolverOptimism]: {
    chain: optimism,
    contracts: {
      L2ReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x0000000000d8e504002cc26e3ec46d81971c1664",
        startBlock: 137403854,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Arbitrum.
   */
  [DatasourceNames.ReverseResolverArbitrum]: {
    chain: arbitrum,
    contracts: {
      L2ReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x0000000000d8e504002cc26e3ec46d81971c1664",
        startBlock: 349263357,
      },
    },
  },

  /**
   * Contracts that power Reverse Resolution on Scroll.
   */
  [DatasourceNames.ReverseResolverScroll]: {
    chain: scroll,
    contracts: {
      L2ReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x0000000000d8e504002cc26e3ec46d81971c1664",
        startBlock: 16604272,
      },
    },
  },

  [DatasourceNames.Seaport]: {
    chain: mainnet,
    contracts: {
      Seaport1_5: {
        abi: Seaport1_5, // Seaport 1.5
        address: "0x00000000000000adc04c56bf30ac9d3c0aaf14dc",
        startBlock: 17129405,
      },
    },
  },
} satisfies ENSNamespace;
