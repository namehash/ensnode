import {
  type DefaultError,
  type DefinedInitialDataOptions,
  type DefinedUseQueryResult,
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  type QueryObserverSuccessResult,
  type UndefinedInitialDataOptions,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Use Stale-While-Revalidate Query
 *
 * This hooks is a proxy for {@link useQuery} with addition of the following
 * semantics:
 * - if the query has been resolved successfully just once,
 *   the query result will always be success with data being the previously
 *   cached result,
 * - the cached result can never go stale, or be garbage collected
 * - the cached result can be only overridden by the current result when
 *   the query is successfully re-fetched (in other words,
 *   the `options.queryFn` returns a resolved promise).
 */
export function useSwrQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<NoInfer<TData>, TError>;
export function useSwrQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>;
export function useSwrQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>;
export function useSwrQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError> {
  const queryClientFromContext = useQueryClient();
  const derivedQueryClient = queryClient ?? queryClientFromContext;

  // cacheResult, if available, is always the last successfully resolved query data
  const cachedResult = derivedQueryClient.getQueryData<TData>(options.queryKey);

  const queryResult = useQuery(
    {
      ...options,
      // cached result can never be stale
      staleTime: cachedResult ? Infinity : undefined,
      // cached result can never be removed by garbage collector
      gcTime: cachedResult ? Infinity : undefined,
      placeholderData: keepPreviousData, // Keep showing previous data during refetch (does not work for errors)
    },
    queryClient,
  );

  // memoize query results to avoid unnecessary UI re-rendering
  const memoizedQueryResult = useMemo(() => {
    // If the query result is error
    // and the cachedResult is available
    // override the query result to be success, including cachedResult data
    if (queryResult.isError && cachedResult) {
      return {
        ...queryResult,
        // set error props
        isError: false,
        error: null,
        isRefetchError: false,
        isLoadingError: false,
        // st success props
        isSuccess: true,
        status: "success",
        data: cachedResult,
      } satisfies QueryObserverSuccessResult<TData, TError>;
    }

    return queryResult;
  }, [queryResult, cachedResult]);

  return memoizedQueryResult;
}
