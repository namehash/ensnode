import type {
  DefaultError,
  FetchQueryOptions,
  ManagedTimerId,
  QueryClient,
  QueryKey,
} from "@tanstack/query-core";
import { hashKey, timeoutManager } from "@tanstack/query-core";

export { QueryClient } from "@tanstack/query-core";

// One interval per queryKey per client
const pollingIntervals = new WeakMap<QueryClient, Map<string, ManagedTimerId>>();

export async function swrQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    staleTime: number;
    refetchInterval?: number;
    warmup?: boolean;
  },
  queryClient: QueryClient,
): Promise<TData> {
  const { queryKey, queryFn, staleTime, refetchInterval, warmup = false, ...rest } = options;

  if (!queryFn) throw new Error("queryFn required");
  if (staleTime <= 0) throw new Error("staleTime must be > 0");

  function getPollingMap(client: QueryClient): Map<string, ManagedTimerId> {
    let map = pollingIntervals.get(client);
    if (!map) {
      map = new Map();
      pollingIntervals.set(client, map);
    }
    return map;
  }

  function setupPolling() {
    if (!refetchInterval) {
      // no refetch interval, no polling
      return;
    }
    const queryHash = hashKey(queryKey); // Correct v5 way
    const map = getPollingMap(queryClient);

    if (map.has(queryHash)) {
      return; // Already polling
    }

    const intervalId = timeoutManager.setInterval(() => {
      queryClient
        .fetchQuery({
          queryKey,
          queryFn,
          staleTime: 0, // Force refetch
          gcTime: Infinity,
          ...rest,
        })
        .catch(() => {
          // Background poll — ignore errors
        });
    }, refetchInterval);

    map.set(queryHash, intervalId);

    // Auto cleanup when query is removed from cache
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "removed" && event.query.queryHash === queryHash) {
        timeoutManager.clearInterval(intervalId);
        map.delete(queryHash);
        unsubscribe();
      }
    });
  }

  // Setup polling (idempotent)
  if (refetchInterval && refetchInterval > 0) {
    setupPolling();
  }

  // Fire-and-forget background revalidation
  queryClient
    .ensureQueryData({
      queryKey,
      queryFn,
      staleTime,
      gcTime: Infinity,
      ...rest,
    })
    .catch(() => {});

  if (warmup && queryClient.getQueryData(queryKey) === undefined) {
    queryClient.prefetchQuery({ queryKey, queryFn, staleTime });
  }

  const cached = queryClient.getQueryData<TData>(queryKey);
  if (cached !== undefined) {
    return cached;
  }

  // First load — must await and can throw
  return await queryClient.fetchQuery({
    queryKey,
    queryFn,
    staleTime,
    gcTime: Infinity,
    ...rest,
  });
}
