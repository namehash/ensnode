/**
 * TODO
 * - root can be inserted on setup or could be discovered naturally — see how that affects traversal/graphql api
 *   - probably easier to just insert it ahead of time like previously
 * - move registration expiration shared logic to sdk/ens
 *   - update isRegistrationFullyExpired todo in ensapi somewhere
 * - RequiredAndNotNull opposite type: RequiredToBeNull<T, keys> for constraining polymorphic entities in graphql schema
 * - re-asses NameWrapper expiry logic — compare to subgraph implementation & see if we can simplify
 * - indexes based on graphql queries, ask claude to compile recommendations
 * - modify Registration schema to more closely match ENSv2, map v1 into it
 * - Renewals (v1, v2)
 *  - include similar /latest / superceding logic, need to be able to reference latest renewal to upsert referrers
 * - ThreeDNS
 * - Migration
 *   - need to understand migration pattern better
 *   - individual names are migrated to v2 and can choose to move to an ENSv2 Registry on L1 or L2
 *   - locked names (wrapped and not unwrappable) are 'frozen' by having their fuses burned
 *     - will need to observe the correct event and then override the existing domain/registratioon info
 *   - for MigratedWrappedNameRegistries, need to check name expiry during resolution and avoid resolving expired names
 * - autocomplete api
 * - Query.permissions(by: { contract: {  } })
 * - custom wrapper for resolveCursorConnection with typesafety that applies defaults and auto-decodes cursors to the indicated type
 * - Pothos envelop plugins (aliases, depth, tokens, whatever)
 * - BEFORE MERGE: revert sepolia.ts namespace back to original, including ensv2 stubs
 *
 * PENDING ENS TEAM
 * - DedicatedResolver moving to EAC
 *  - depends on: namechain --testNames script not crashing in commit >= 803a940
 * - Domain.canonical/Domain.canonicalPath/Domain.fqdn depends on:
 *  - depends on: Registry.canonicalName implementation + indexing
 * - Signal Pattern for Registry contracts
 *  - depends on: ens team implementing in namechain contracts
 *
 * MAYBE DO LATER?
 * - ? better typechecking for polymorphic entities in drizzle schema
 *   - could do polymorphic resolver/registration metadata
 *   - would map well to resolver extensions in graphql
 * - ? move all entity ids to opaque base58 encoded IDs? kinda nice since they're just supposed to be opaque, useful for relay purposes, allows the scalar types to all be ID and then casted. but nice to use CAIP identifiers for resolvers and permissions etc. so just for domains and registries?
 *
 * TODO MUCH LATER
 * - after moving protocol-tracing away from otel we can use otel for ourselves
 *  https://pothos-graphql.dev/docs/plugins/tracing
 *
 */

import { createConfig } from "ponder";

import {
  AnyRegistrarABI,
  AnyRegistrarControllerABI,
  DatasourceNames,
  EnhancedAccessControlABI,
  ETHRegistrarABI,
  RegistryABI,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { getDatasourcesWithENSv2Contracts } from "@ensnode/ensnode-sdk/internal";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  getRequiredDatasources,
  maybeGetDatasources,
} from "@/lib/ponder-helpers";

export const pluginName = PluginName.ENSv2;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot, //
];

const ALL_DATASOURCE_NAMES = [
  ...REQUIRED_DATASOURCE_NAMES,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ENSv2Root,
  DatasourceNames.ENSv2ETHRegistry,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      ensroot, //
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    const {
      ENSv2ETHRegistry, //
      basenames,
      lineanames,
    } = maybeGetDatasources(config.namespace, ALL_DATASOURCE_NAMES);

    const DATASOURCES_WITH_ENSV2_CONTRACTS = getDatasourcesWithENSv2Contracts(config.namespace);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        ALL_DATASOURCE_NAMES,
      ),

      contracts: {
        ////////////////////////////
        // ENSv2 Registry Contracts
        ////////////////////////////
        [namespaceContract(pluginName, "ENSv2Registry")]: {
          abi: RegistryABI,
          chain: DATASOURCES_WITH_ENSV2_CONTRACTS.reduce(
            (memo, datasource) => ({
              ...memo,
              ...chainConfigForContract(
                config.globalBlockrange,
                datasource.chain.id,
                datasource.contracts.Registry,
              ),
            }),
            {},
          ),
        },

        ///////////////////////////////////
        // EnhancedAccessControl Contracts
        ///////////////////////////////////
        [namespaceContract(pluginName, "EnhancedAccessControl")]: {
          abi: EnhancedAccessControlABI,
          chain: DATASOURCES_WITH_ENSV2_CONTRACTS.reduce(
            (memo, datasource) => ({
              ...memo,
              ...chainConfigForContract(
                config.globalBlockrange,
                datasource.chain.id,
                datasource.contracts.EnhancedAccessControl,
              ),
            }),
            {},
          ),
        },

        //////////////////////
        // ENSv2 ETHRegistrar
        //////////////////////
        [namespaceContract(pluginName, "ETHRegistrar")]: {
          abi: ETHRegistrarABI,
          chain: {
            ...(ENSv2ETHRegistry &&
              chainConfigForContract(
                config.globalBlockrange,
                ENSv2ETHRegistry.chain.id,
                ENSv2ETHRegistry.contracts.ETHRegistrar,
              )),
          },
        },

        //////////////////////////////////////
        // ENSv1RegistryOld on ENS Root Chain
        //////////////////////////////////////
        [namespaceContract(pluginName, "ENSv1RegistryOld")]: {
          abi: ensroot.contracts.ENSv1RegistryOld.abi,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.ENSv1RegistryOld,
            ),
          },
        },

        //////////////////////////////////////
        // ENSv1Registry on
        //   - ENS Root Chain
        //   - Basenames
        //   - Lineanames
        //////////////////////////////////////
        [namespaceContract(pluginName, "ENSv1Registry")]: {
          abi: ensroot.contracts.ENSv1Registry.abi,
          chain: {
            // ENS Root Chain Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.ENSv1Registry,
            ),
            // Basenames (shadow)Registry if defined
            ...(basenames &&
              chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.Registry,
              )),
            // Lineanames (shadow)Registry if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.Registry,
              )),
          },
        },

        //////////////////////////////////////
        // NameWrapper on
        //   - ENS Root Chain
        //   - Lineanames
        //////////////////////////////////////
        [namespaceContract(pluginName, "NameWrapper")]: {
          abi: ensroot.contracts.NameWrapper.abi,
          chain: {
            // ENS Root Chain NameWrapper
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.NameWrapper,
            ),
            // Lineanames NameWrapper if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.NameWrapper,
              )),
          },
        },

        ///////////////////
        // Base Registrars
        ///////////////////
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          abi: AnyRegistrarABI,
          chain: {
            // Ethnames BaseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.BaseRegistrar,
            ),
            // Basenames BaseRegistrar, if defined
            ...(basenames &&
              chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.BaseRegistrar,
              )),
            // Lineanames BaseRegistrar, if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.BaseRegistrar,
              )),
          },
        },

        /////////////////////////
        // Registrar Controllers
        /////////////////////////
        [namespaceContract(pluginName, "RegistrarController")]: {
          abi: AnyRegistrarControllerABI,
          chain: {
            ///////////////////////////////////
            // Ethnames Registrar Controllers
            ///////////////////////////////////
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.LegacyEthRegistrarController,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.WrappedEthRegistrarController,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.UnwrappedEthRegistrarController,
            ),

            ///////////////////////////////////
            // Basenames Registrar Controllers
            ///////////////////////////////////
            ...(basenames && {
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.EARegistrarController,
              ),
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.RegistrarController,
              ),
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.UpgradeableRegistrarController,
              ),
            }),

            ////////////////////////////////////
            // Lineanames Registrar Controllers
            ////////////////////////////////////
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.EthRegistrarController,
              )),
          },
        },
      },
    });
  },
});
