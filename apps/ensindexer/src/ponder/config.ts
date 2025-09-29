import config from "@/config";
import type { ENSIndexerConfig } from "@/config/types";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { ALL_PLUGINS, type AllPluginsMergedConfig } from "@/plugins";

////////
// Merge the active plugins' configs into a single ponder config.
////////

// filter all plugins by those activated in the config
const activePlugins = ALL_PLUGINS.filter((plugin) => config.plugins.includes(plugin.name));

// merge the active plugins' Ponder configs and type as AllPluginsMergedConfig representing the merged
// types of each plugin's `config`, so ponder's typechecking of the indexing handlers and their event
// arguments is correct, regardless of which plugins are actually active at runtime.
const ponderConfig = activePlugins.reduce(
  (memo, plugin) => mergePonderConfigs(memo, plugin.createPonderConfig(config)),
  {},
) as AllPluginsMergedConfig;

// NOTE: here we inject all values from the ENSIndexerConfig that alter the indexing behavior of the
// Ponder config in order to alter the ponder-generated build id when these options change.
//
// This ensures that running ENSIndexer with different configurations maintains compatibility with
// Ponder's default crash recovery behavior.
//
// https://ponder.sh/docs/api-reference/ponder/database#build-id-and-crash-recovery
(ponderConfig as any).indexingBehaviorDependencies = {
  // while technically not necessary, since these configuration properties are reflected in the
  // generated ponderConfig, we include them here for clarity
  namespace: config.namespace,
  plugins: config.plugins,
  globalBlockrange: config.globalBlockrange,

  // these config properties don't explicitly affect the generated ponderConfig and need to be
  // injected here to ensure that, if they are configured differently, ponder generates a unique
  // build id to differentiate between runs with otherwise-identical configs (see above).
  isSubgraphCompatible: config.isSubgraphCompatible,
  labelSet: config.labelSet,
} satisfies Pick<
  ENSIndexerConfig,
  "namespace" | "plugins" | "globalBlockrange" | "isSubgraphCompatible" | "labelSet"
>;

////////
// Set indexing order strategy
////////

// NOTE: We explicitly enforce `omnichain` ordering within ENSIndexer. ENSIndexer may be able to
// support 'multichain' event ordering in the future, with additional testing, but for simplicity
// only omnichain is currently supported at the moment.
//
// For additional info see: https://ponder.sh/docs/api-reference/ponder/config#guarantees
ponderConfig.ordering = "omnichain";

export default ponderConfig;
