import { useMemo } from "react";

import { useENSNodeConfig } from "@ensnode/ensnode-react";
import {
  hasGraphqlApiConfigSupport,
  hasRegistrarActionsConfigSupport,
  hasRegistrarActionsIndexingStatusSupport,
  hasSubgraphApiConfigSupport,
} from "@ensnode/ensnode-sdk";
import { PrerequisiteResult } from "@ensnode/ensnode-sdk/internal";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";

/**
 * The status of a given Feature, depending on the prerequisites and connected ENSNode's status.
 */
export type FeatureStatus =
  | { type: "error"; reason: string }
  | { type: "connecting" }
  | { type: "not-ready"; reason: string }
  | { type: "unsupported"; reason: string }
  | { type: "supported" };

export interface ENSAdminFeatures {
  /**
   * Whether ENSAdmin's Registrar Actions tooling is supported by the connected ENSNode.
   */
  registrarActions: FeatureStatus;

  /**
   * Whether ENSAdmin's Subgraph Compatible GraphQL API tooling is supported by the connected ENSNode.
   */
  subgraph: FeatureStatus;

  /**
   * Whether ENSAdmin's ENSNode GraphQL API tooling is supported by the connected ENSNode.
   */
  graphql: FeatureStatus;
}

const prerequisiteResultToFeatureStatus = (result: PrerequisiteResult): FeatureStatus => {
  if (result.supported) return { type: "supported" };
  return { type: "unsupported", reason: result.reason };
};

/**
 * Hook that derives whether certain ENSAdmin features are supported by the connected ENSNode.
 */
export function useENSAdminFeatures(): ENSAdminFeatures {
  const configQuery = useENSNodeConfig();
  const indexingStatusQuery = useIndexingStatusWithSwr();

  // all features depend on being able to retrieve the connected ensnode's config
  if (configQuery.status === "error") {
    const error: FeatureStatus = {
      type: "error",
      reason: "ENSNode config could not be fetched successfully.",
    };
    return { registrarActions: error, subgraph: error, graphql: error };
  }

  // all features depend on being able to retrieve the connected ensnode's config
  if (configQuery.status === "pending") {
    const connecting: FeatureStatus = { type: "connecting" };
    return { registrarActions: connecting, subgraph: connecting, graphql: connecting };
  }

  const { ensIndexerPublicConfig } = configQuery.data;

  // registrarActions depends on indexing status as well, so derive further
  // TODO: when any future features require checking indexing status as well, we can abstract this
  const registrarActions = useMemo<FeatureStatus>(() => {
    const result = hasRegistrarActionsConfigSupport(ensIndexerPublicConfig);
    if (!result.supported) return prerequisiteResultToFeatureStatus(result);

    switch (indexingStatusQuery.status) {
      case "error": {
        return {
          type: "error",
          reason: "Indexing Status could not be fetched successfully.",
        };
      }
      case "pending": {
        return { type: "connecting" };
      }
      case "success": {
        const { realtimeProjection } = indexingStatusQuery.data;
        const { omnichainSnapshot } = realtimeProjection.snapshot;

        const result = hasRegistrarActionsIndexingStatusSupport(omnichainSnapshot.omnichainStatus);
        if (!result.supported) return { type: "not-ready", reason: result.reason };
        return { type: "supported" };
      }
    }
  }, [indexingStatusQuery, ensIndexerPublicConfig]);

  // subgraph just depends on config
  const subgraph: FeatureStatus = prerequisiteResultToFeatureStatus(
    hasSubgraphApiConfigSupport(ensIndexerPublicConfig),
  );

  // graphql just depends on config
  const graphql: FeatureStatus = prerequisiteResultToFeatureStatus(
    hasGraphqlApiConfigSupport(ensIndexerPublicConfig),
  );

  return { registrarActions, subgraph, graphql };
}
