import {
  ContractConfig,
  Datasource,
  DatasourceName,
  ENSNamespaceId,
  getENSNamespace,
} from "@ensnode/datasources";
import { Label, Name, PluginName } from "@ensnode/ensnode-sdk";
import { NetworkConfig } from "ponder";
import { http, Chain } from "viem";

import type { ENSIndexerConfig } from "@/config/types";
import { uniq } from "@/lib/lib-helpers";
import { constrainContractBlockrange } from "@/lib/ponder-helpers";

/**
 * A factory function that returns a function to create a namespaced contract name for Ponder handlers.
 *
 * Ponder config requires a flat dictionary of contract config entires, where each entry has its
 * unique name and set of EVM event names derived from the contract's ABI. Ponder will use contract
 * names and their respective event names to create names for indexing handlers. For example, a contract
 * named  `Registry` includes events: `NewResolver` and `NewTTL`. Ponder will create indexing handlers
 * named `Registry:NewResolver` and `Registry:NewTTL`.
 *
 * However, because plugins within ENSIndexer may use the same contract/event names, an additional
 * namespace prefix is required to distinguish between contracts having the same name, with different
 * implementations. The strong typing is helpful and necessary for Ponder's auto-generated types to apply.
 *
 * @example
 * ```ts
 * const subgraphNamespace = makePluginNamespace(PluginName.Subgraph);
 * const basenamesNamespace = makePluginNamespace(PluginName.Basenames);
 *
 * subgraphNamespace("Registry"); // returns "subgraph/Registry"
 * basenamesNamespace("Registry"); // returns "basenames/Registry"
 * ```
 */
export function makePluginNamespace<PLUGIN_NAME extends PluginName>(pluginName: PLUGIN_NAME) {
  if (/[.:]/.test(pluginName)) {
    throw new Error("Reserved character: Plugin namespace prefix cannot contain '.' or ':'");
  }

  /** Creates a namespaced contract name */
  return function pluginNamespace<CONTRACT_NAME extends string>(
    contractName: CONTRACT_NAME,
  ): `${PLUGIN_NAME}/${CONTRACT_NAME}` {
    return `${pluginName}/${contractName}`;
  };
}

/**
 * Describes an ENSIndexerPlugin used within the ENSIndexer project.
 */
export interface ENSIndexerPlugin<
  PLUGIN_NAME extends PluginName = PluginName,
  PONDER_CONFIG = unknown,
> {
  /**
   * A unique plugin name for identification
   */
  pluginName: PLUGIN_NAME;

  /**
   * A list of DatasourceNames this plugin requires access to, necessary for determining whether
   * a set of ACTIVE_PLUGINS are valid for a given ENS Namespace
   */
  requiredDatasources: DatasourceName[];

  /**
   * An ENSIndexerPlugin must return a Ponder Config.
   * https://ponder.sh/docs/contracts-and-networks
   */
  createPonderConfig(appConfig: ENSIndexerConfig): PONDER_CONFIG;

  /**
   * An `activate` handler that should load the plugin's handlers that eventually execute `ponder.on`
   */
  activate: () => Promise<void>;
}

/**
 * An ENSIndexerPlugin's handlers are provided runtime information about their respective plugin.
 */
export type ENSIndexerPluginHandlerArgs<PLUGIN_NAME extends PluginName = PluginName> = {
  pluginName: PLUGIN_NAME;
  pluginNamespace: ReturnType<typeof makePluginNamespace<PLUGIN_NAME>>;
};

/**
 * An ENSIndexerPlugin accepts ENSIndexerPluginHandlerArgs and registers ponder event handlers.
 */
export type ENSIndexerPluginHandler<PLUGIN_NAME extends PluginName> = (
  args: ENSIndexerPluginHandlerArgs<PLUGIN_NAME>,
) => void;

/**
 * A helper function for defining an ENSIndexerPlugin's `activate()` function.
 *
 * Given a set of handler file imports, returns a function that executes them with the provided args.
 */
export const activateHandlers =
  <PLUGIN_NAME extends PluginName>({
    handlers,
    ...args
  }: ENSIndexerPluginHandlerArgs<PLUGIN_NAME> & {
    handlers: () => Promise<{ default: ENSIndexerPluginHandler<PLUGIN_NAME> }>[];
  }) =>
  async () => {
    await Promise.all(handlers()).then((modules) => modules.map((m) => m.default(args)));
  };

/**
 * Get a list of unique indexed chain IDs for selected plugin names.
 */
export function getIndexedChainIds(datasources: Datasource[]): number[] {
  const indexedChainIds = datasources.map((datasource) => datasource.chain.id);

  return uniq(indexedChainIds);
}

/**
 * Builds a ponder#NetworksConfig for a single, specific chain.
 */
export function networksConfigForChain(config: ENSIndexerConfig, chainId: number) {
  if (!config.rpcConfigs[chainId]) {
    throw new Error(
      `networksConfigForChain called for chain id ${chainId} but no associated rpcConfig is available in ENSIndexerConfig. rpcConfig specifies the following chain ids: [${Object.keys(config.rpcConfigs).join(", ")}].`,
    );
  }

  const { url, maxRequestsPerSecond } = config.rpcConfigs[chainId]!;

  return {
    [chainId.toString()]: {
      chainId: chainId,
      transport: http(url),
      maxRequestsPerSecond,
      // NOTE: disable cache on local chains (e.g. Anvil, Ganache)
      ...((chainId === 31337 || chainId === 1337) && { disableCache: true }),
    } satisfies NetworkConfig,
  };
}

/**
 * Builds a `ponder#ContractConfig['network']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 */
export function networkConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  config: ENSIndexerConfig,
  chain: Chain,
  contractConfig: CONTRACT_CONFIG,
) {
  return {
    [chain.id.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      ...constrainContractBlockrange(config, contractConfig.startBlock), // per-network blockrange
    },
  };
}

const POSSIBLE_PREFIXES = [
  "data:application/json;base64,",
  "data:application/json;_base64,", // idk, sometimes 3dns returns this malformed prefix
];

/**
 * Parses a base64-encoded JSON metadata URI to extract the label and name.
 *
 * @param uri - The base64-encoded JSON metadata URI string
 * @returns A tuple containing [label, name] if parsing succeeds, or [null, null] if it fails
 */
export function parseLabelAndNameFromOnChainMetadata(uri: string): [Label, Name] | [null, null] {
  if (!POSSIBLE_PREFIXES.some((prefix) => uri.startsWith(prefix))) {
    // console.error("Invalid tokenURI format:", uri);
    return [null, null];
  }

  const base64String = POSSIBLE_PREFIXES.reduce((memo, prefix) => memo.replace(prefix, ""), uri);
  const jsonString = Buffer.from(base64String, "base64").toString("utf-8");
  const metadata = JSON.parse(jsonString);

  // trim the . off the end of the fqdn
  const name = metadata?.name?.slice(0, -1);
  if (!name) return [null, null];

  const [label] = name.split(".");

  return [label, name];
}

/**
 * ENSNamespaceFullyDefinedAtCompileTime is a helper type necessary to support runtime-conditional
 * Ponder plugins.
 *
 * 1. ENSNode can be configured to index in the context of different ENS namespaces,
 *   (currently: mainnet, sepolia, holesky, ens-test-env), using a user-specified set of plugins.
 * 2. Ponder's inferred type-checking requires const-typed values, and so those plugins must be able
 *   to define their Ponder config statically so the types can be inferred at compile-time, regardless
 *   of whether the plugin's config and handler logic is loaded/executed at runtime.
 * 3. To make this work, we provide a ENSNamespaceFullyDefinedAtCompileTime, set to the typeof mainnet's
 *   ENSNamespace, which fully defines all known Datasources (if this is ever not the case, a merged
 *   type can be used to ensure that this type has the full set of possible Datasources). Plugins
 *   can use the runtime value returned from {@link getENSNamespaceAsFullyDefinedAtCompileTime} and
 *   by casting it to ENSNamespaceFullyDefinedAtCompileTime we ensure that the values expected by
 *   those plugins pass the typechecker. ENSNode ensures that non-active plugins are not executed,
 *   so the issue of type/value mismatch does not occur during execution.
 */
type ENSNamespaceFullyDefinedAtCompileTime = ReturnType<
  typeof getENSNamespace<ENSNamespaceId.Mainnet>
>;

/**
 * Returns the ENSNamespace for the provided `namespaceId`, cast to ENSNamespaceFullyDefinedAtCompileTime.
 *
 * See {@link ENSNamespaceFullyDefinedAtCompileTime} for more info.
 *
 * @param namespaceId - The ENS namespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns the ENSNamespace
 */
export const getENSNamespaceAsFullyDefinedAtCompileTime = (namespaceId: ENSNamespaceId) =>
  getENSNamespace(namespaceId) as ENSNamespaceFullyDefinedAtCompileTime;

/**
 * Returns the `datasourceName` Datasource within the `namespaceId` namespace, cast as ENSNamespaceFullyDefinedAtCompileTime.
 *
 * NOTE: the typescript typechecker will _not_ enforce validity. i.e. using an invalid `datasourceName`
 * within the specified `namespaceId` will have a valid return type but be undefined at runtime.
 */
export const getDatasourceAsFullyDefinedAtCompileTime = <
  N extends ENSNamespaceId,
  D extends keyof ENSNamespaceFullyDefinedAtCompileTime,
>(
  namespaceId: N,
  datasourceName: D,
) => getENSNamespaceAsFullyDefinedAtCompileTime(namespaceId)[datasourceName];
