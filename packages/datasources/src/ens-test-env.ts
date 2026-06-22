// ABIs for EFP Datasources
import { AccountMetadata as efp_AccountMetadata } from "./abis/efp/AccountMetadata";
import { ListRecords as efp_ListRecords } from "./abis/efp/ListRecords";
import { ListRegistry as efp_ListRegistry } from "./abis/efp/ListRegistry";
import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
// ABIs for ENSRoot Datasource
import { BaseRegistrar as root_BaseRegistrar } from "./abis/root/BaseRegistrar";
import { LegacyEthRegistrarController as root_LegacyEthRegistrarController } from "./abis/root/LegacyEthRegistrarController";
import { NameWrapper as root_NameWrapper } from "./abis/root/NameWrapper";
import { Registry as root_Registry } from "./abis/root/Registry";
import { UnwrappedEthRegistrarController as root_UnwrappedEthRegistrarController } from "./abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController as root_WrappedEthRegistrarController } from "./abis/root/WrappedEthRegistrarController";
import { StandaloneReverseRegistrar } from "./abis/shared/StandaloneReverseRegistrar";
import { UniversalResolverABI } from "./abis/shared/UniversalResolver";
import { contracts, efpContracts } from "./devnet/constants";
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
        address: contracts.LegacyENSRegistry,
        startBlock: 0,
      },
      // NOTE: named ENSRegistry in devnet
      ENSv1Registry: {
        abi: root_Registry, // Registry was redeployed, same abi
        address: contracts.ENSRegistry,
        startBlock: 0,
      },
      Resolver: {
        abi: ResolverABI,
        startBlock: 0,
      },
      // NOTE: named BaseRegistrarImplementation in devnet
      BaseRegistrar: {
        abi: root_BaseRegistrar,
        address: contracts.BaseRegistrarImplementation,
        startBlock: 0,
      },
      // NOTE: named LegacyETHRegistrarController in devnet
      LegacyEthRegistrarController: {
        abi: root_LegacyEthRegistrarController,
        address: contracts.LegacyETHRegistrarController,
        startBlock: 0,
      },
      // NOTE: named WrappedETHRegistrarController in devnet
      WrappedEthRegistrarController: {
        abi: root_WrappedEthRegistrarController,
        address: contracts.WrappedETHRegistrarController,
        startBlock: 0,
      },
      // NOTE: named ETHRegistrarController in devnet
      UnwrappedEthRegistrarController: {
        abi: root_UnwrappedEthRegistrarController,
        address: contracts.ETHRegistrarController,
        startBlock: 0,
      },
      NameWrapper: {
        abi: root_NameWrapper,
        address: contracts.NameWrapper,
        startBlock: 0,
      },
      UniversalResolver: {
        abi: UniversalResolverABI,
        address: contracts.UpgradableUniversalResolverProxy,
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
        address: contracts.RootRegistry,
        startBlock: 0,
      },
      ETHRegistry: {
        abi: Registry,
        address: contracts.ETHRegistry,
        startBlock: 0,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: contracts.ETHRegistrar,
        startBlock: 0,
      },
      ENSv1Resolver: {
        abi: ResolverABI,
        address: contracts.ENSV1Resolver,
        startBlock: 0,
      },
      ENSv2Resolver: {
        abi: ResolverABI,
        address: "0xc6e7df5e7b4f2a278906862b61205850344d4e7d",
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.ReverseResolverRoot]: {
    chain: ensTestEnvChain,
    contracts: {
      DefaultReverseRegistrar: {
        abi: StandaloneReverseRegistrar,
        address: contracts.DefaultReverseRegistrar,
        startBlock: 0,
      },

      // NOTE: named DefaultReverseResolver in devnet
      DefaultReverseResolver3: {
        abi: ResolverABI,
        address: contracts.DefaultReverseResolver,
        startBlock: 0,
      },

      // NOTE: named LegacyPublicResolver in devnet
      DefaultPublicResolver4: {
        abi: ResolverABI,
        address: contracts.LegacyPublicResolver,
        startBlock: 0,
      },

      // NOTE: named PublicResolver in devnet
      DefaultPublicResolver5: {
        abi: ResolverABI,
        address: contracts.PublicResolver,
        startBlock: 0,
      },
    },
  },

  /**
   * EFP Datasources
   *
   * The Ethereum Follow Protocol contracts, deployed onto the ens-test-env devnet by the EFP devnet
   * image (attach mode) on top of the ENS deployment. On the `mainnet` namespace EFP spans Base,
   * Optimism, and Ethereum; the single-chain devnet has only one EFP deployment, so all three EFP
   * datasources resolve to `ensTestEnvChain` (id 31337) with the same `ListRecords` contract.
   *
   * The EFP plugin's Ponder config keys each contract by chain id, so the three datasources collapse
   * to a single set of contracts on chain 31337 (no double-indexing). This relies on the
   * `ListRecords` address being IDENTICAL across all three datasources below — if they diverge, the
   * per-chain-id merge silently keeps only `EFPEthereum`'s.
   *
   * @see docker/services/efp-devnet.yml for how these contracts are deployed and addresses captured.
   */
  [DatasourceNames.EFPBase]: {
    chain: ensTestEnvChain,
    contracts: {
      ListRegistry: {
        abi: efp_ListRegistry,
        address: efpContracts.EFPListRegistry,
        startBlock: 0,
      },
      AccountMetadata: {
        abi: efp_AccountMetadata,
        address: efpContracts.EFPAccountMetadata,
        startBlock: 0,
      },
      ListRecords: {
        abi: efp_ListRecords,
        address: efpContracts.EFPListRecords,
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.EFPOptimism]: {
    chain: ensTestEnvChain,
    contracts: {
      ListRecords: {
        abi: efp_ListRecords,
        address: efpContracts.EFPListRecords,
        startBlock: 0,
      },
    },
  },

  [DatasourceNames.EFPEthereum]: {
    chain: ensTestEnvChain,
    contracts: {
      ListRecords: {
        abi: efp_ListRecords,
        address: efpContracts.EFPListRecords,
        startBlock: 0,
      },
    },
  },
} satisfies ENSNamespace;
