import type { ENSNamespaceId } from "@ensnode/datasources";

import type { TheGraphFallback } from "./config/thegraph";

/**
 * Determines whether, given the provided context, a request can be handled by a TheGraph-hosted
 * Subgraph.
 */
export const canFallbackToTheGraph = ({
  namespace,
  theGraphApiKey,
  isSubgraphCompatible,
}: {
  namespace: ENSNamespaceId;
  theGraphApiKey: string | undefined;
  isSubgraphCompatible: boolean;
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
    case "holesky":
      return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/i5EXyL9MzTXWKCmpJ2LG6sbzBfXneUPVuTXaSjYhDDF`;
    default:
      return null;
  }
};
