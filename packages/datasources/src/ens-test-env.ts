import { zeroAddress } from "viem";

import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UniversalRegistrarRenewalWithReferrer as root_UniversalRegistrarRenewalWithReferrer } from "./abis/root/UniversalRegistrarRenewalWithReferrer";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
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
 * @see https://github.com/ensdomains/namechain
 *
 * NOTE: The ens-test-env ENS namespace does not support Basenames, Lineanames, or 3DNS.
 * NOTE: The ens-test-env ENS namespace does not (yet) support ENSIP-19 Reverse Resolvers.
 */
export default {
  /**
   * ENSRoot Datasource
   *
   * Addresses and Start Blocks from Namechain devnet
   * https://github.com/ensdomains/namechain
   */
  [DatasourceNames.ENSRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      ENSv1RegistryOld: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      },
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575",
        startBlock: 0,
      },
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: "0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2",
        startBlock: 0,
      },
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        startBlock: 0,
      },
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: "0x51a1ceb83b83f1985a81c295d1ff28afef186e02",
        startBlock: 0,
      },
      UniversalRegistrarRenewalWithReferrer: {
        abi: root_UniversalRegistrarRenewalWithReferrer,
        address: zeroAddress,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: "0xfd471836031dc5108809d173a067e8486b9047a3",
        startBlock: 0,
      },
      UniversalResolver: {
        abi: root_UniversalResolver,
        address: "0xbec49fa140acaa83533fb00a2bb19bddd0290f25",
        startBlock: 0,
      },
      UniversalResolverV2: {
        abi: root_UniversalResolver,
        address: "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07",
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
        address: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x84ea74d481ee0a5332c457a4d796187f6ba67feb",
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0x1291be112d480055dafd8a610b7d1e203891c274",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: "0x95401dc811bb5740090279ba06cfa8fcf6113778",
        startBlock: 0,
      },

      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: "0x70e0ba845a1a0f2da3359c97e0285013525ffc49",
        startBlock: 0,
      },

      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: "0x172076e0166d1f9cc711c77adf8488051744980c",
        startBlock: 0,
      },

      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: "0x4ee6ecad1c2dae9f525404de8555724e3c35d07b",
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
