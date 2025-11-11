import { useQuery } from "@tanstack/react-query";
import { getUnixTime } from "date-fns";
import { useEffect, useSyncExternalStore } from "react";

import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  type IndexingStatusRequest,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type RealtimeIndexingStatusProjection,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponse> {}

/**
 * Singleton store for managing shared projection state across all hook instances.
 * This ensures all components using the hook see the exact same projection object
 * and timestamp, preventing unnecessary re-renders from distinct but equivalent objects.
 */
class IndexingStatusStore {
  private snapshot: CrossChainIndexingStatusSnapshotOmnichain | null = null;
  private currentProjection: RealtimeIndexingStatusProjection | null = null;
  private currentTimestamp: number | null = null;
  private listeners = new Set<() => void>();
  private intervalId: NodeJS.Timeout | null = null;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    // Start timer when first subscriber arrives
    if (this.listeners.size === 1) {
      this.startTimer();
    }

    return () => {
      this.listeners.delete(listener);

      // Stop timer when last subscriber leaves
      if (this.listeners.size === 0) {
        this.stopTimer();
      }
    };
  };

  getSnapshot = (): RealtimeIndexingStatusProjection | null => {
    return this.currentProjection;
  };

  /**
   * Update the cached snapshot with new data from the API.
   * Each incremental snapshot will have >= indexing progress than previous snapshots.
   */
  updateSnapshot(snapshot: CrossChainIndexingStatusSnapshotOmnichain): void {
    this.snapshot = snapshot;
    this.regenerateProjection();
  }

  private startTimer(): void {
    // Generate initial projection immediately
    this.regenerateProjection();

    // Then update every second
    this.intervalId = setInterval(() => {
      this.regenerateProjection();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private regenerateProjection(): void {
    if (!this.snapshot) {
      return;
    }

    const projectedAt = getUnixTime(new Date());

    // Only regenerate if timestamp has changed (1 second granularity)
    if (this.currentTimestamp === projectedAt) {
      return;
    }

    this.currentTimestamp = projectedAt;
    this.currentProjection = createRealtimeIndexingStatusProjection(this.snapshot, projectedAt);

    // Notify all subscribers
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

// Singleton instance shared across all hook usages
const store = new IndexingStatusStore();

/**
 * Hook for fetching and tracking indexing status with client-side projection updates.
 *
 * Clients often need frequently updated worst-case distance for their logic,
 * but calling the API every second would be inefficient. Instead, we fetch a
 * snapshot and keep it in memory. We then asynchronously attempt to update it every 10 seconds.
 *
 * From the most recently cached snapshot, this hook generates new projections —
 * entirely in memory — every second. All components using this hook share the exact
 * same projection object and timestamp, ensuring consistency across your UI and
 * preventing unnecessary re-renders from equivalent but distinct objects.
 *
 * Each projection provides a recalculation of worst-case distance based on:
 *   • The current time (shared across all hook instances, updated every second)
 *   • The snapshot's absolute timestamps of recorded indexing progress
 *
 * This works reliably because indexing progress is virtually always non-decreasing over
 * time (virtually never goes backward). Clients can safely assume that a snapshot from a
 * few seconds ago is still valid for building new projections. Since snapshots
 * exclusively contain absolute timestamps, we can reuse a snapshot across time to compute
 * updated worst-case projections without additional API calls.
 *
 * Performance characteristics:
 *   • Snapshots are fetched from the API every 10 seconds
 *   • Projections are regenerated every second (only when components are subscribed)
 *   • All components receive the same projection object reference (no unnecessary re-renders)
 *   • Timer automatically stops when no components are using the hook
 *
 * @param parameters - Configuration options
 * @param parameters.config - ENSNode SDK configuration (optional, uses context if not provided)
 * @param parameters.query - TanStack Query options for customizing query behavior (refetchInterval, enabled, etc.)
 * @returns TanStack Query result containing the current indexing status projection
 */
export function useIndexingStatus(
  parameters: WithSDKConfigParameter & UseIndexingStatusParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createIndexingStatusQueryOptions(_config);

  const options = {
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - indexing status changes frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  const queryResult = useQuery(options);

  // Update the shared store whenever we get a new snapshot from the API
  useEffect(() => {
    if (queryResult.data && queryResult.data.responseCode === IndexingStatusResponseCodes.Ok) {
      store.updateSnapshot(queryResult.data.realtimeProjection.snapshot);
    }
  }, [queryResult.data]);

  // Subscribe to the shared projection store.
  // This ensures all components see the exact same projection object at the same time.
  const realtimeProjection = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  // If we have a projection, return it wrapped in the response format
  if (realtimeProjection) {
    return {
      ...queryResult,
      data: {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } as IndexingStatusResponse,
      isError: false,
      error: null,
    };
  }

  // Otherwise return the raw query result (loading, error, or no data yet)
  return queryResult;
}
