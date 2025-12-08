import {
  type DefaultError,
  type DefinedInitialDataOptions,
  type DefinedUseQueryResult,
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
 *
 * Please note how there can be any number of failed queries before one
 * succeeds. In such case, no successful result has ever been cached and
 * the query fails (`isError: true`, `error` is available) until
 * the first successful resolution (`isSuccess: true`, `data` is available).
 *
 * @example
 * ```tsx
 * const swrQuery = useSwrQuery({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 * });
 *
 * if (swrQuery.isPending) {
 *   // Show loading state while there's no cached successful result and
 *   // no query attempt was finished yet.
 *   return <>Loading...</>;
 * }
 *
 * if (swrQuery.isError) {
 *   // Show error state when query attempt fails and
 *   // no cached successful result is available.
 *   return <>Error: {swrQuery.error.message}</>;
 * }
 *
 * // Otherwise, show data when the cached successful result is available.
 * return <>Data: {JSON.stringify(swrQuery.data)}</>;
 * ```
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
  const cachedSuccessfulResult = derivedQueryClient.getQueryData<TData>(options.queryKey);

  const queryResult = useQuery(
    {
      ...options,
      // cached result can never be stale
      staleTime: cachedSuccessfulResult ? Infinity : undefined,
      // cached result can never be removed by garbage collector
      gcTime: cachedSuccessfulResult ? Infinity : undefined,
    },
    queryClient,
  );

  // memoize query results to avoid unnecessary UI re-rendering
  const memoizedQueryResult = useMemo(() => {
    // If the query result is error
    // and the cachedSuccessfulResult is available
    // override the query result to be success, replacing the unsuccessful
    // result with the most recent cachedSuccessfulResult
    if (queryResult.isError && cachedSuccessfulResult) {
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
        data: cachedSuccessfulResult,
      } satisfies QueryObserverSuccessResult<TData, TError>;
    }

    return queryResult;
  }, [queryResult, cachedSuccessfulResult]);

  return memoizedQueryResult;
}
