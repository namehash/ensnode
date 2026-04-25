import { zeroAddress } from "viem";

import { EnhancedAccessControl } from "../abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "../abis/ensv2/ETHRegistrar";
import { Registry } from "../abis/ensv2/Registry";
import { UniversalResolverV2 } from "../abis/ensv2/UniversalResolverV2";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "../abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "../abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "../abis/root/NameWrapper";
import { Registry as root_Registry } from "../abis/root/Registry";
import { UniversalRegistrarRenewalWithReferrer as root_UniversalRegistrarRenewalWithReferrer } from "../abis/root/UniversalRegistrarRenewalWithReferrer";
import { UniversalResolverV1 } from "../abis/root/UniversalResolverV1";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "../abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "../abis/root/WrappedEthRegistrarController";
import { StandaloneReverseRegistrar } from "../abis/shared/StandaloneReverseRegistrar";
import { ensTestEnvChain } from "../lib/chains";
// Shared ABIs
import { ResolverABI } from "../lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "../lib/types";
import { contracts } from "./constants";

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
        address: contracts.legacyEnsRegistry,
        startBlock: 0,
      },
      // NOTE: named ENSRegistry in devnet
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: contracts.ensRegistry,
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      // NOTE: named BaseRegistrarImplementation in devnet
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: contracts.baseRegistrar,
        startBlock: 0,
      },
      // NOTE: named LegacyETHRegistrarController in devnet
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: contracts.legacyEthRegistrarController,
        startBlock: 0,
      },
      // NOTE: named WrappedETHRegistrarController in devnet
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: contracts.wrappedEthRegistrarController,
        startBlock: 0,
      },
      // NOTE: named ETHRegistrarController in devnet
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: contracts.ethRegistrarController,
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
        address: contracts.nameWrapper,
        startBlock: 0,
      },
      UniversalResolver: {
        abi: UniversalResolverV1,
        address: contracts.universalResolver,
        startBlock: 0,
      },
      // NOTE: named UniversalResolverV2 in devnet
      UniversalResolverV2: {
        abi: UniversalResolverV2,
        address: contracts.universalResolverV2,
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
        address: contracts.rootRegistry,
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: contracts.ethRegistry,
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: contracts.ethRegistrar,
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: contracts.defaultReverseRegistrar,
        startBlock: 0,
      },

      // NOTE: named DefaultReverseResolver in devnet
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: contracts.defaultReverseResolver,
        startBlock: 0,
      },

      // NOTE: named LegacyPublicResolver in devnet
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: contracts.legacyPublicResolver,
        startBlock: 0,
      },

      // NOTE: named PublicResolver in devnet
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: contracts.publicResolver,
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
