import { zeroAddress } from "viem";

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
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { ensTestEnvChain } from "./lib/chains";
// Shared ABIs
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";

/**
 * The ens-test-env ENSNamespace
 *
 * 'ens-test-env' represents a deterministic deployment of the ENS protocol to a local Anvil chain
 * for development and testing.
 *
 * @see https://github.com/ensdomains/ens-test-env
 * @see https://github.com/ensdomains/contracts-v2
 *
 * NOTE: The ens-test-env ENS namespace does not support Basenames, Lineanames, or 3DNS.
 * NOTE: The ens-test-env ENS namespace does not (yet) support ENSIP-19 Reverse Resolvers.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from ENSv2 devnet
   * https://github.com/ensdomains/contracts-v2
   */
  [DatasourceNames.ENSRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      // NOTE: named LegacyENSRegistry in devnet
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      },
      // NOTE: named ENSRegistry in devnet
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      // NOTE: named BaseRegistrarImplementation in devnet
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90",
        startBlock: 0,
      },
      // NOTE: named LegacyETHRegistrarController in devnet
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43",
        startBlock: 0,
      },
      // NOTE: named WrappedETHRegistrarController in devnet
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      // NOTE: named ETHRegistrarController in devnet
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x36b58f5c1969b7b6591d752ea6f5486d069010ab",
        startBlock: 0,
      },
      // NOTE: not in devnet, set to zeroAddress
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: UniversalResolverV1,
        address: "0xd84379ceae14aa33c123af12424a37803f885889",
        startBlock: 0,
      },
      // NOTE: named UniversalResolverV2 in devnet
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: "0x162a433068f51e18b7d13932f27e66a3f99e6890",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ENSv2Root]: {
    chain: ensTestEnvChain,
    contracts: {
      Resolver: { abi: ResolverABI, startBlock: 0 },
      Registry: { abi: Registry, startBlock: 0 },
      EnhancedAccessControl: { abi: EnhancedAccessControl, startBlock: 0 },
      RootRegistry: {
        abi: Registry,
        address: "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6",
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x9e545e3c0baab3e08cdfd552c960a1050f373042",
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x998abeb3e57409262ae5b751f60747921b33613e",
        startBlock: 0,
      },

      // NOTE: named DefaultReverseResolver in devnet
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x4826533b4897376654bb4d4ad88b7fafd0c98528",
        startBlock: 0,
      },

      // NOTE: named LegacyPublicResolver in devnet
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x4ee6ecad1c2dae9f525404de8555724e3c35d07b",
        startBlock: 0,
      },

      // NOTE: named PublicResolver in devnet
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0xbec49fa140acaa83533fb00a2bb19bddd0290f25",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
