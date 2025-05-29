import config from "@/config";
import type { ENSIndexerConfig } from "@/config/types";
import { prettyPrintConfig } from "@/lib/lib-config";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import type { MergedTypes } from "@/lib/plugin-helpers";

import basenamesPlugin from "@/plugins/basenames/basenames.plugin";
import lineaNamesPlugin from "@/plugins/lineanames/lineanames.plugin";
import reverseResolversPlugin from "@/plugins/reverse-resolvers/reverse-resolvers.plugin";
import subgraphPlugin from "@/plugins/subgraph/subgraph.plugin";
import threednsPlugin from "@/plugins/threedns/threedns.plugin";

////////
// First, generate `MergedPonderConfig` type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct, regardless
// of which plugins are actually active at runtime.
////////

export const ALL_PLUGINS = [
  subgraphPlugin,
  basenamesPlugin,
  lineaNamesPlugin,
  threednsPlugin,
  reverseResolversPlugin,
] as const;

export type MergedPonderConfig = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]> & {
  /**
   * NOTE: we inject additional values (ones that change the behavior of the indexing logic) into the
   * Ponder config in order to alter the ponder-generated build id when these additional options change.
   *
   * This ensures that running ENSIndexer with different configurations maintains compatibility with
   * Ponder's default crash recovery behavior.
   *
   * https://ponder.sh/docs/api-reference/ponder/database#build-id-and-crash-recovery
   **/
  indexingBehaviorDependencies: Pick<
    ENSIndexerConfig,
    "healReverseAddresses" | "indexAdditionalResolverRecords"
  >;
};

////////
// Merge the plugins' configs into a single ponder config, including injected dependencies.
////////

// filter all plugins by those activated by the config
const activePlugins = ALL_PLUGINS.filter((plugin) => config.plugins.includes(plugin.pluginName));

// combine each plugins' config into a MergedPonderConfig
const ponderConfig = activePlugins.reduce(
  (memo, plugin) => mergePonderConfigs(memo, plugin.config),
  {},
) as MergedPonderConfig;

// inject the additional indexing behavior dependencies
ponderConfig.indexingBehaviorDependencies = {
  healReverseAddresses: config.healReverseAddresses,
  indexAdditionalResolverRecords: config.indexAdditionalResolverRecords,
};

////////
// Activate the active plugins' handlers, which register indexing handlers with Ponder.
////////

// NOTE: we explicitly delay the execution of this function for 1 tick, to avoid a race condition
// within ponder internals related to the schema name and drizzle-orm
setTimeout(() => activePlugins.map((plugin) => plugin.activate()), 0);

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

console.log(`ENSIndexer running with config:\n${prettyPrintConfig(config)}`);

if (process.env.PONDER_LOG_LEVEL === "debug") console.log(JSON.stringify(ponderConfig));

// Object.values(ponderConfig.contracts).forEach((contract) =>
//   Object.entries(contract.network).forEach(([chainId, contractNetwork]) => {
//     (contractNetwork.endBlock as any) = "latest";
//   }),
// );

export default ponderConfig;
