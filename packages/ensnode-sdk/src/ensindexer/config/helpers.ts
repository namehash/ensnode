import { ENSNamespaceIds } from "@ensnode/datasources";
import { type ENSIndexerPublicConfig, PluginName } from "./types";

/**
 * Determines if the provided `config` produces an index equivalent to the ENS Subgraph.
 *
 * @see https://ensnode.io/docs/reference/subgraph-compatibility/
 */
export function isSubgraphCompatible(
  config: Pick<
    ENSIndexerPublicConfig,
    | "namespace"
    | "plugins"
    | "healReverseAddresses"
    | "indexAdditionalResolverRecords"
    | "replaceUnnormalized"
    | "labelSet"
  >,
): boolean {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. healReverseAddresses = false
  // 3. indexAdditionalResolverRecords = false
  // 4. replaceUnnormalized = false
  const indexingBehaviorIsSubgraphCompatible =
    !config.healReverseAddresses &&
    !config.indexAdditionalResolverRecords &&
    !config.replaceUnnormalized;

  const isSubgraphLabelSet =
    config.labelSet.labelSetId === "subgraph" && config.labelSet.labelSetVersion === 0;

  const isEnsTestEnvLabelSet =
    config.labelSet.labelSetId === "ens-test-env" && config.labelSet.labelSetVersion === 0;

  // 5. label set id must be "subgraph" and version must be 0 in non-ens-test-env namespaces, otherwise
  // ens-test-env labelset is allowed
  const labelSetIsSubgraphCompatible =
    isSubgraphLabelSet || (config.namespace === ENSNamespaceIds.EnsTestEnv && isEnsTestEnvLabelSet);

  return (
    onlySubgraphPluginActivated &&
    indexingBehaviorIsSubgraphCompatible &&
    labelSetIsSubgraphCompatible
  );
}
