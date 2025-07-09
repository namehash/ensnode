import config from "@/config";
import type { ENSIndexerConfig } from "@/config/types";
import { prettyPrintConfig } from "@/lib/lib-config";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { ALL_PLUGINS, type AllPluginsMergedConfig } from "@/plugins";

////////
// Log ENSIndexerConfig for debugging.
////////

console.log(`ENSIndexer running with config:\n${prettyPrintConfig(config)}`);

////////
// Merge the active plugins' configs into a single ponder config.
////////

// filter all plugins by those activated in the config
const activePlugins = ALL_PLUGINS.filter((plugin) =>
	config.plugins.includes(plugin.name),
);

// merge the active plugins' Ponder configs and type as AllPluginsMergedConfig representing the merged
// types of each plugin's `config`, so ponder's typechecking of the indexing handlers and their event
// arguments is correct, regardless of which plugins are actually active at runtime.
const ponderConfig = activePlugins.reduce(
	(memo, plugin) => mergePonderConfigs(memo, plugin.createPonderConfig(config)),
	{},
) as AllPluginsMergedConfig;

// NOTE: here we inject additional values (ones that change the behavior of the indexing logic) into
// the Ponder config in order to alter the ponder-generated build id when these additional options change.
//
// This ensures that running ENSIndexer with different configurations maintains compatibility with
// Ponder's default crash recovery behavior.
//
// https://ponder.sh/docs/api-reference/ponder/database#build-id-and-crash-recovery
(ponderConfig as any).indexingBehaviorDependencies = {
	healReverseAddresses: config.healReverseAddresses,
	indexAdditionalResolverRecords: config.indexAdditionalResolverRecords,
} satisfies Pick<
	ENSIndexerConfig,
	"healReverseAddresses" | "indexAdditionalResolverRecords"
>;

////////
// Set indexing order strategy
////////

// NOTE: Ponder uses the `multichain` strategy by default, so we enforce `omnichain` ordering here.
// ENSIndexer may be able to support multichain event ordering in the future, with additional testing,
// but for simplicity only omnichain is currently supported at the moment.
ponderConfig.ordering = "omnichain";

////////
// Export the ponderConfig for Ponder to use for type inference and runtime behavior.
////////

export default ponderConfig;
