import type { TheGraphFallback } from "@ensnode/ensnode-sdk";
import { makeTheGraphSubgraphUrl } from "@ensnode/ensnode-sdk/internal";

import type { EnsApiConfig } from "@/config/config.schema";

export const canFallbackToTheGraph = ({
  namespace,
  theGraphApiKey,
  ensIndexerPublicConfig: { isSubgraphCompatible },
}: Pick<EnsApiConfig, "namespace" | "theGraphApiKey"> & {
  ensIndexerPublicConfig: Pick<EnsApiConfig["ensIndexerPublicConfig"], "isSubgraphCompatible">;
}): TheGraphFallback => {
  // must be subgraph-compatible
  if (!isSubgraphCompatible) return { canFallback: false, reason: "not-subgraph-compatible" };

  // must have api key for The Graph
  const hasApiKey = theGraphApiKey !== undefined;
  if (!hasApiKey) return { canFallback: false, reason: "no-api-key" };

  // and namespace must be supported by The Graph
  const hasTheGraphSubgraphUrl = makeTheGraphSubgraphUrl(namespace, theGraphApiKey) !== null;
  if (!hasTheGraphSubgraphUrl) return { canFallback: false, reason: "no-subgraph-url" };

  // otherwise able to fallback
  return { canFallback: true, reason: null };
};
