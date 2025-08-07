import { Duration } from "../../shared";
import { ChainIndexingStatus, ChainIndexingStatusId, ChainIndexingStatusIds } from "./types";

export function getOverallStatus(chains: ChainIndexingStatus[]): ChainIndexingStatusId {
  const chainStatuses = chains.map((chain) => chain.status);

  let overallStatus: ChainIndexingStatusId;

  if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Following)) {
    overallStatus = ChainIndexingStatusIds.Following;
  } else if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Backfill)) {
    overallStatus = ChainIndexingStatusIds.Backfill;
  } else if (
    chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Unstarted)
  ) {
    overallStatus = ChainIndexingStatusIds.Unstarted;
  } else {
    overallStatus = ChainIndexingStatusIds.Completed;
  }

  return overallStatus;
}

export function getApproximateRealtimeDistances(chains: ChainIndexingStatus[]): Duration {
  const chainStatuses = chains.map((chain) => chain.status);

  const chainApproximateRealtimeDistances = chains
    .filter((chain) => chain.status === ChainIndexingStatusIds.Following)
    .map((chain) => chain.approximateRealtimeDistance);

  if (chainApproximateRealtimeDistances.length === 0) {
    return 0;
  }

  const approximateRealtimeDistance = Math.max(...chainApproximateRealtimeDistances);

  return approximateRealtimeDistance;
}
