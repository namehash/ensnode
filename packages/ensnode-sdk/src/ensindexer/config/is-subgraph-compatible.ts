import { ENSNamespaceIds } from "@ensnode/datasources";
import { type ENSIndexerPublicConfig, PluginName } from "./types";

/**
 * Determines if the provided `config` results in indexing behavior compatible with the legacy ENS
 * Subgraph.
 *
 * @see https://ensnode.io/docs/reference/subgraph-compatibility/
 */
export function isSubgraphCompatible(
  config: Pick<ENSIndexerPublicConfig, "namespace" | "plugins" | "labelSet">,
): boolean {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. label set id must be "subgraph" and version must be 0
  const isSubgraphLabelSet =
    config.labelSet.labelSetId === "subgraph" && config.labelSet.labelSetVersion === 0;

  const isEnsTestEnvLabelSet =
    config.labelSet.labelSetId === "ens-test-env" && config.labelSet.labelSetVersion === 0;

  // config should be considered subgraph-compatible if in ens-test-env namespace with ens-test-env labelset
  const labelSetIsSubgraphCompatible =
    isSubgraphLabelSet || (config.namespace === ENSNamespaceIds.EnsTestEnv && isEnsTestEnvLabelSet);

  return onlySubgraphPluginActivated && labelSetIsSubgraphCompatible;
}
