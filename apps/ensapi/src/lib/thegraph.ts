import type { ENSNamespaceId } from "@ensnode/datasources";
import type { TheGraphFallback } from "@ensnode/ensnode-sdk";

export const canFallbackToTheGraph = (
  namespace: ENSNamespaceId,
  apiKey: string | undefined,
): TheGraphFallback => {
  // must have api key for The Graph
  const hasApiKey = apiKey !== undefined;
  if (!hasApiKey) return { canFallback: false, reason: "no-api-key" };

  // and namespace must be supported by The Graph
  const hasTheGraphSubgraphUrl = makeTheGraphSubgraphUrl(namespace, apiKey) !== null;
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
