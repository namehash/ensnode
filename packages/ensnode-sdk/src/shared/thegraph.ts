import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

import type { TheGraphFallback } from "./config/thegraph";

/**
 * Determines whether, given the provided context, a Subgraph GraphQL API request can be handled by
 * a TheGraph-hosted Subgraph.
 *
 * @see https://ensnode.io/docs/concepts/what-is-the-ens-subgraph/
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
  // NOTE: that Subgraph Compatibility requires that 'subgraph' is the only plugin, excluding
  //  alpha-style deployments, which are unable to fall back to thegraph due to data inconsistency
  if (!isSubgraphCompatible) return { canFallback: false, reason: "not-subgraph-compatible" };

  // must have api key for The Graph
  const hasApiKey = theGraphApiKey !== undefined;
  if (!hasApiKey) return { canFallback: false, reason: "no-api-key" };

  // and namespace must be supported by The Graph
  const url = makeTheGraphSubgraphUrl(namespace, theGraphApiKey);
  if (url === null) return { canFallback: false, reason: "no-subgraph-url" };

  // otherwise able to fallback
  return { canFallback: true, url };
};

/**
 * Retrieves the URL of a TheGraph-hosted Subgraph given the provided `namespace`, authenticating
 * with the provided `apiKey`.
 */
const makeTheGraphSubgraphUrl = (namespace: ENSNamespaceId, apiKey: string) => {
  switch (namespace) {
    case ENSNamespaceIds.Mainnet:
      return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`;
    case ENSNamespaceIds.Sepolia:
      return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/G1SxZs317YUb9nQX3CC98hDyvxfMJNZH5pPRGpNrtvwN`;
    case ENSNamespaceIds.EnsTestEnv:
      return null;
    default:
      throw new Error("never");
  }
};
