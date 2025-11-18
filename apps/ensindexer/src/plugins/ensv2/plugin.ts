/**
 * TODO
 * - polymorphic resolver metadata in drizzle schema
 * - polymorphic resolver in graphql, add owner to DedicatedResolver schema
 *
 * Migration
 * - individual names are migrated to v2 and can choose to move to an ENSv2 Registry on L1 or L2
 * - locked names (wrapped and not unwrappable) are 'frozen' by having their fuses burned
 *   - will need to observe the correct event and then override the existing domain/registratioon info
 * - need to know migration status of every domain in order to to construct canonical namegraph at index-time.
 * - maybe instead of constructing canonical namegraph we keep it all separate? when addressing domains by name we'd have to more or less perform traversals, including bridgedresolvers. but that's fine? we're going to have to mix forward resolution logic into the api anyway, either at the canonical namegraph construction or while traversing the namegraph
 * v2 .eth registry will have a special fallback resolver that resolvers via namechain state
 * - fuck me, there can be multiple registrations in v2 world. sub.example.xyz, if not emancipated, cannot be migrated, but sub.example.xyz can still be created in v2 registry in the example.xyz registry.
 *   - if a v2 name is registered but there's an active namewrapper registration for that same name, we should perhaps ignore all future namewrapper events, as the v2 name overrides it in resolution and the namewrapper is never more consulted for that name (and i guess any subnames under it?)
 *  - shadow-registering an existing name in v2 also shadows every name under it so we kind of need to do a recursive deletion of all of a shadowed name's subnames, right? cause resolution terminates at the first v2-registered name.
 *
 *
 * - for MigratedWrappedNameRegistries, need to check name expiry during resolution and avoid resolving expired names
 *
 * - ThreeDNS
 * - Renewals
 * - indexes
 * - https://pothos-graphql.dev/docs/plugins/tracing
 * - connections w/ limits & cursors
 * - Resolver polymorphism & Bridged Resolver materialization
 *   - Account.dedicatedResolvers
 * - Registry.canonicalName
 *   - then update canonical traversal to use canonicalName
 * - Account.permissions -> PermissionsUser[]
 *
 *
 * move all entity ids to opaque base58 encoded IDs? kinda nice since they're just supposed to be opaque, useful for relay purposes, allows the scalar types to all be ID and then casted. but nice to use CAIP identifiers for resolvers and permissions etc. so many just for domains and registries?
 * test alpha sepolia + protocol accelerateion index time vs ensv2
 */

import { createConfig } from "ponder";

import {
  AnyRegistrarABI,
  AnyRegistrarControllerABI,
  DatasourceNames,
  EnhancedAccessControlABI,
  RegistryABI,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

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
  DatasourceNames.Namechain,
];

const ALL_DATASOURCE_NAMES = [
  ...REQUIRED_DATASOURCE_NAMES,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      ensroot, //
      namechain,
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    const {
      basenames, //
      lineanames,
    } = maybeGetDatasources(config.namespace, ALL_DATASOURCE_NAMES);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        ALL_DATASOURCE_NAMES,
      ),

      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          abi: RegistryABI,
          chain: [ensroot, namechain]
            .filter((ds) => !!ds)
            .reduce(
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
        [namespaceContract(pluginName, "EnhancedAccessControl")]: {
          abi: EnhancedAccessControlABI,
          chain: [ensroot, namechain]
            .filter((ds) => !!ds)
            .reduce(
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

        // index the ENSv1RegistryOld on ENS Root Chain
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

        // index ENSv1Registry on ENS Root Chain, Basenames, Lineanames
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

        // index NameWrapper on ENS Root Chain, Lineanames
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
