import { useMemo } from "react";

import { useENSNodeConfig } from "@ensnode/ensnode-react";
import {
  hasGraphqlApiConfigSupport,
  hasRegistrarActionsConfigSupport,
  hasRegistrarActionsIndexingStatusSupport,
  hasSubgraphApiConfigSupport,
  PrerequisiteResult,
} from "@ensnode/ensnode-sdk";

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

const CONNECTING_STATUS: FeatureStatus = { type: "connecting" };

const CONFIG_ERROR_STATUS: FeatureStatus = {
  type: "error",
  reason: "ENSNode config could not be fetched successfully.",
};

const INDEXING_STATUS_ERROR_STATUS: FeatureStatus = {
  type: "error",
  reason: "Indexing Status could not be fetched successfully.",
};

/**
 * Hook that derives whether certain ENSAdmin features are supported by the connected ENSNode.
 */
export function useENSAdminFeatures(): ENSAdminFeatures {
  const configQuery = useENSNodeConfig();
  const indexingStatusQuery = useIndexingStatusWithSwr();

  const registrarActions = useMemo<FeatureStatus>(() => {
    if (configQuery.status === "error") return CONFIG_ERROR_STATUS;
    if (configQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexerPublicConfig } = configQuery.data;
    const result = hasRegistrarActionsConfigSupport(ensIndexerPublicConfig);
    if (!result.supported) return prerequisiteResultToFeatureStatus(result);

    switch (indexingStatusQuery.status) {
      case "error": {
        return INDEXING_STATUS_ERROR_STATUS;
      }
      case "pending": {
        return CONNECTING_STATUS;
      }
      case "success": {
        const { realtimeProjection } = indexingStatusQuery.data;
        const { omnichainSnapshot } = realtimeProjection.snapshot;

        const result = hasRegistrarActionsIndexingStatusSupport(omnichainSnapshot.omnichainStatus);
        if (!result.supported) return { type: "not-ready", reason: result.reason };
        return { type: "supported" };
      }
    }
  }, [configQuery, indexingStatusQuery]);

  const subgraph: FeatureStatus = useMemo(() => {
    if (configQuery.status === "error") return CONFIG_ERROR_STATUS;
    if (configQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexerPublicConfig } = configQuery.data;
    return prerequisiteResultToFeatureStatus(hasSubgraphApiConfigSupport(ensIndexerPublicConfig));
  }, [configQuery]);

  const graphql: FeatureStatus = useMemo(() => {
    if (configQuery.status === "error") return CONFIG_ERROR_STATUS;
    if (configQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexerPublicConfig } = configQuery.data;
    return prerequisiteResultToFeatureStatus(hasGraphqlApiConfigSupport(ensIndexerPublicConfig));
  }, [configQuery]);

  return { registrarActions, subgraph, graphql };
}
