import { zeroAddress } from "viem";
import { sepolia } from "viem/chains";

// ABIs for ENSv2 Datasource
import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
import { UniversalResolverV2 } from "./abis/ensv2/UniversalResolverV2";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalRegistrarRenewalWithReferrer as root_UniversalRegistrarRenewalWithReferrer } from "./abis/root/UniversalRegistrarRenewalWithReferrer";
import { UniversalResolverV1 } from "./abis/root/UniversalResolverV1";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";
// Shared ABIs
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

// we use the earliest start block for simplicity (it's just for efficiency re: log fetches)
const startBlock = 10462220;

/**
 * The Sepolia V2 ENSNamespace
 *
 * This represents a testing deployment of ENSv1 w/ ENSv2 on Sepolia.
 */
export default {
  /**
   * ENS Root contracts deployed on Sepolia for the ENSv1 + ENSv2 test deployment.
   *
   * NOTE: `UniversalRegistrarRenewalWithReferrer` is a placeholder entry required by the typesystem
   * due to the registrar plugin; it does not exist on Sepolia V2 and therefore uses the zero address.
   */
  [DatasourceNames.ENSRoot]: {
    chain: sepolia,
    contracts: {
      // NOTE: named LegacyENSRegistry in deployment
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x34f4bf3d71e1e598ee116fe1f279e6726cec889c",
        startBlock,
      },
      // NOTE: named ENSRegistry in deployment
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x7e89b563f936c68c31a360840eb7f9a4aacaf014",
        startBlock,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock,
      },
      // NOTE: named BaseRegistrarImplementation in deployment
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0x6409609247722761b8ba96371485de92a6d7b83b",
        startBlock,
      },
      // NOTE: named LegacyETHRegistrarController in deployment
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x92615558c16edf4ad69fa8cc026b7bcb10e01dfd",
        startBlock,
      },
      // NOTE: named WrappedETHRegistrarController in deployment
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0xeeaa2f99e12917b95e7d6801e0eac9296ada8093",
        startBlock,
      },
      // NOTE: named ETHRegistrarController in deployment
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0xf42df26c1b222bee5a6b78cbb8bbfaa0ba07786a",
        startBlock,
      },
      // NOTE: not in deployment, set to zeroAddress
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xc7e033b8836e4bd55d069d113f018b98478cb091",
        startBlock,
      },
      UniversalResolver: {
        abi: UniversalResolverV1,
        address: "0xf8e7a86707ad360daac5d998fd1a6196a6a8823b",
        startBlock,
      },
      // NOTE: named UniversalResolverV2 in deployment
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: "0x4dc74fef4fc6b5a810a1554d431f06c8d8b7451c",
        startBlock,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: sepolia,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock },
      Registry: { abi: Registry, startBlock },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock },
      RootRegistry: {
        abi: Registry,
        address: "0x3a3e15a5d27ff6f05c844313312f2e72096d3ed3",
        startBlock,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x796fff2e907449be8d5921bcc215b1b76d89d080",
        startBlock,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x68586418353b771cf2425ed14a07512aa880c532",
        startBlock,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: sepolia,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x348bb9f8c6947c34c74cb0263a954e23a1255553",
        startBlock,
      },

      // NOTE: named DefaultReverseResolver in deployment
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0xb03c924c750f0a98002fce829b59c688f4088546",
        startBlock,
      },

      // NOTE: named LegacyPublicResolver in deployment
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0xc30ba2bd21583605d815826c3807e8224e398e10",
        startBlock,
      },

      // NOTE: named PublicResolver in deployment
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0x640294a2b2d87e7f522db3e3e3e876764bce170d",
        startBlock,
      },
      BaseReverseResolver: {
        abi: ResolverABI,
        address: "0xb16bde9c9573b25ce277977751d480bc848639df",
        startBlock,
      },
      LineaReverseResolver: {
        abi: ResolverABI,
        address: "0xe789657ecb3007a748bf5630e3405fa767c82767",
        startBlock,
      },
      OptimismReverseResolver: {
        abi: ResolverABI,
        address: "0xcd91d0cefa6dfa6009ab2338c30491a5886d16f9",
        startBlock,
      },
      ArbitrumReverseResolver: {
        abi: ResolverABI,
        address: "0xb70a40b54683e831bded727c45338780df9d1310",
        startBlock,
      },
      ScrollReverseResolver: {
        abi: ResolverABI,
        address: "0xc0227efe2c95adc4e3dac14b06533f2bd8b3782d",
        startBlock,
      },
    },
  },
} satisfies ENSNamespace;
