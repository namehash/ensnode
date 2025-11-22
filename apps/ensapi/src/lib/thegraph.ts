import type { ENSNamespaceId } from "@ensnode/datasources";
import type { TheGraphFallback } from "@ensnode/ensnode-sdk";

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

export const makeTheGraphSubgraphUrl = (namespace: ENSNamespaceId, apiKey: string) => {
  switch (namespace) {
    case "mainnet":
      return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`;
    case "sepolia":
      return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/G1SxZs317YUb9nQX3CC98hDyvxfMJNZH5pPRGpNrtvwN`;
    default:
      return null;
  }
};
