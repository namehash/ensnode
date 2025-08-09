import { zeroAddress } from "viem";
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

// ABIs for Lineanames Datasource
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/lineanames/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/lineanames/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/lineanames/NameWrapper";
import { Registry as linea_Registry } from "./abis/lineanames/Registry";
import { ThreeDNSToken } from "./abis/threedns/ThreeDNSToken";

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
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        startBlock: 9380380,
      },
      Resolver: {
        abi: ResolverABI,
        filter: ResolverFilter,
        startBlock: 3327417, // ignores any Resolver events prior to `startBlock` of RegistryOld on Mainnet
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
        startBlock: 9380410,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
        startBlock: 9380471,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
        startBlock: 16925618,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547",
        startBlock: 22764821,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
        startBlock: 16925608,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xaBd80E8a13596fEeA40Fd26fD6a24c3fe76F05fB",
        startBlock: 22671701,
      },
      //
      LegacyPublicResolver: {
        abi: ResolverABI,
        address: "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41",
        startBlock: 9412610,
      },
      PublicResolver: {
        abi: ResolverABI,
        address: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
        startBlock: 16925619,
      },
      BasenamesL1Resolver: {
        abi: ResolverABI,
        address: "0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31",
        startBlock: 20420641,
      },
      LineanamesL1Resolver: {
        abi: ResolverABI,
        address: "0xde16ee87B0C019499cEBDde29c9F7686560f679a",
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
      L2Resolver: {
        abi: ResolverABI,
        address: "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD",
        startBlock: 17575714,
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
        abi: ResolverABI,
        filter: ResolverFilter,
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
        abi: ResolverABI,
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
        abi: ResolverABI,
        // NOTE: 3DNSToken on Base has a hardcoded protocol-wide Resolver at this address
        address: "0xF97aAc6C8dbaEBCB54ff166d79706E3AF7a813c8",
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
      // NOTE: the DefaultReverseResolver1 (aka LegacyDefaultReverseResolver) does NOT emit events
      // and is effectively unindexable for the purposes of Reverse Resolution. We document it here
      // for completeness, but/and explicity do not index it.
      DefaultReverseResolver1: {
        abi: ResolverABI,
        address: "0xA2C122BE93b0074270ebeE7f6b7292C7deB45047",
        startBlock: 9380501,
      },

      // this DefaultReverseResolver was enabled in the following proposal:
      // https://discuss.ens.domains/t/ep3-5-executable-activate-new-eth-controller-and-reverse-registrar/16776
      // https://www.tally.xyz/gov/ens/proposal/42973781582803845389836855775840822719678533376883030929209752909248937768242
      // DefaultReverseResolver2 is the pre-ENSIP-19 DefaultReverseResolver and it emits
      // Resolver#NameChanged events. We index these events to power aspects of Protocol Acceleration.
      DefaultReverseResolver2: {
        abi: ResolverABI,
        address: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
        startBlock: 16925619,
      },

      // this DefaultReverseResolver was enabled in the following proposal:
      // https://discuss.ens.domains/t/executable-enable-l2-reverse-registrars-and-new-eth-registrar-controller/20969
      // https://www.tally.xyz/gov/ens/proposal/42524979896803285837776370636134389407867034021879791462477783237030656381157
      // NOTE: DefaultReverseResolver3 is not directly indexed: it simply reads data from
      // DefaultReverseRegistrar, which IS indexed. We document it here for completeness.
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0xA7d635c8de9a58a228AA69353a1699C7Cc240DCF",
        startBlock: 22764871,
      },

      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x283F227c4Bd38ecE252C4Ae7ECE650B0e913f1f9",
        startBlock: 22764819,
      },

      BaseReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#80002105.reverse
        address: "0xc800DBc8ff9796E58EfBa2d7b35028DdD1997E5e",
        startBlock: 22764838,
      },

      LineaReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000e708.reverse
        address: "0x0Ce08a41bdb10420FB5Cac7Da8CA508EA313aeF8",
        startBlock: 22764840,
      },

      OptimismReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000000a.reverse
        address: "0xF9Edb1A21867aC11b023CE34Abad916D29aBF107",
        startBlock: 22764854,
      },

      ArbitrumReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#8000a4b1.reverse
        address: "0x4b9572C03AAa8b0Efa4B4b0F0cc0f0992bEDB898",
        startBlock: 22764837,
      },

      ScrollReverseResolver: {
        abi: ResolverABI,
        // https://adraffy.github.io/ens-normalize.js/test/resolver.html#80082750.reverse
        address: "0xC4842814cA523E481Ca5aa85F719FEd1E9CaC614",
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
        address: "0x0000000000D8e504002cC26E3Ec46D81971C1664",
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
        address: "0x0000000000D8e504002cC26E3Ec46D81971C1664",
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
        address: "0x0000000000D8e504002cC26E3Ec46D81971C1664",
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
        address: "0x0000000000D8e504002cC26E3Ec46D81971C1664",
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
        address: "0x0000000000D8e504002cC26E3Ec46D81971C1664",
        startBlock: 16604272,
      },
    },
  },
} satisfies ENSNamespace;
