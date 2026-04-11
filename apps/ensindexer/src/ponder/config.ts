import config from "@/config";

import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { ALL_PLUGINS, type AllPluginsMergedConfig } from "@/plugins";

import { IndexingBehaviorInjectionContract } from "./indexing-behavior-injection-contract";

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

/**
 * NOTE: By injecting the {@link IndexingBehaviorInjectionContract} into
 * the `contracts` field of the Ponder Config, we ensure that any changes to
 * the indexing behavior dependencies defined in
 * {@link IndexingBehaviorInjectionContract.indexingBehaviorDependencies} will
 * result in a different Ponder Build ID. This ensures that running ENSIndexer
 * with different configurations maintains compatibility with Ponder's default
 * crash recovery behavior.
 *
 * @see https://ponder.sh/docs/api-reference/ponder/database#build-id-and-crash-recovery
 */
ponderConfig.contracts = {
  ...ponderConfig.contracts,
  // @ts-expect-error - `ponderConfig.contracts` is a constant type, so the type system
  // doesn't allow us to add new properties to it, but we have to inject the
  // IndexingBehaviorInjectionContract here.
  IndexingBehaviorInjectionContract,
};

////////
// Set indexing order strategy
////////

// NOTE: We explicitly enforce `omnichain` ordering within ENSIndexer. ENSIndexer may be able to
// support 'multichain' event ordering in the future, with additional testing, but for simplicity
// only omnichain is currently supported at the moment.
//
// For additional info see: https://ponder.sh/docs/api-reference/ponder/config#guarantees
ponderConfig.ordering = "omnichain";

// By default, if the `DATABASE_URL` environment variable is set,
// Ponder will use it for the connection string to the Postgres database.
// However, we want Ponder to always use the `ENSDB_URL` environment variable instead and so
// we make explicit use of it here.
ponderConfig.database = {
  connectionString: config.ensDbUrl,
  kind: "postgres",
};

export default ponderConfig;
