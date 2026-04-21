import { useMemo } from "react";

import {
  hasOmnigraphApiConfigSupport,
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
   * Whether ENSAdmin's ENSNode Omnigraph API tooling is supported by the connected ENSNode.
   */
  omnigraph: FeatureStatus;
}

const prerequisiteResultToFeatureStatus = (result: PrerequisiteResult): FeatureStatus => {
  if (result.supported) return { type: "supported" };
  return { type: "unsupported", reason: result.reason };
};

const CONNECTING_STATUS: FeatureStatus = { type: "connecting" };

const INDEXING_STATUS_ERROR_STATUS: FeatureStatus = {
  type: "error",
  reason: "Indexing Status could not be fetched successfully.",
};

/**
 * Hook that derives whether certain ENSAdmin features are supported by the connected ENSNode.
 */
export function useENSAdminFeatures(): ENSAdminFeatures {
  const indexingStatusQuery = useIndexingStatusWithSwr();

  const registrarActions = useMemo<FeatureStatus>(() => {
    if (indexingStatusQuery.status === "error") return INDEXING_STATUS_ERROR_STATUS;
    if (indexingStatusQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexer: ensIndexerPublicConfig } = indexingStatusQuery.data.stackInfo;
    const configSupportResult = hasRegistrarActionsConfigSupport(ensIndexerPublicConfig);
    if (!configSupportResult.supported)
      return prerequisiteResultToFeatureStatus(configSupportResult);

    const { realtimeProjection } = indexingStatusQuery.data;
    const { omnichainSnapshot } = realtimeProjection.snapshot;

    const indexingStatusSupportResult = hasRegistrarActionsIndexingStatusSupport(
      omnichainSnapshot.omnichainStatus,
    );
    if (!indexingStatusSupportResult.supported)
      return { type: "not-ready", reason: indexingStatusSupportResult.reason };
    return { type: "supported" };
  }, [indexingStatusQuery]);

  const subgraph: FeatureStatus = useMemo(() => {
    if (indexingStatusQuery.status === "error") return INDEXING_STATUS_ERROR_STATUS;
    if (indexingStatusQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexer: ensIndexerPublicConfig } = indexingStatusQuery.data.stackInfo;
    return prerequisiteResultToFeatureStatus(hasSubgraphApiConfigSupport(ensIndexerPublicConfig));
  }, [indexingStatusQuery]);

  const omnigraph: FeatureStatus = useMemo(() => {
    if (indexingStatusQuery.status === "error") return INDEXING_STATUS_ERROR_STATUS;
    if (indexingStatusQuery.status === "pending") return CONNECTING_STATUS;

    const { ensIndexer: ensIndexerPublicConfig } = indexingStatusQuery.data.stackInfo;
    return prerequisiteResultToFeatureStatus(hasOmnigraphApiConfigSupport(ensIndexerPublicConfig));
  }, [indexingStatusQuery]);

  return { registrarActions, subgraph, omnigraph };
}
