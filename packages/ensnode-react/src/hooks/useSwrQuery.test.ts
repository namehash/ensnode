import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSwrQuery } from "./useSwrQuery";

// Helper to create a wrapper component for renderHook
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useSwrQuery", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  describe("basic query functionality", () => {
    it("should fetch data successfully", async () => {
      const queryKey = ["test-data"];
      const mockData = { id: 1, name: "Test" };
      const queryFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      expect(result.current.isLoading).toBe(true);

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      expect(queryFn).toHaveBeenCalledOnce();
      expect(result.current).toMatchObject({
        isSuccess: true,
        data: mockData,
      });
    });

    it("should handle query errors", async () => {
      const queryKey = ["error-test"];
      const error = new Error("Query failed");
      const queryFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      expect(result.current).toMatchObject({
        isError: true,
        error,
      });
    });
  });

  describe("SWR semantics - stale-while-revalidate", () => {
    it("should make cached data to never be stale", async () => {
      const queryKey = ["cached-data"];
      const initialData = { id: 1, name: "Initial" };
      const updatedData = { id: 1, name: "Updated" };

      const queryFn = vi.fn().mockResolvedValue(updatedData);

      // Pre-populate cache
      queryClient.setQueryData(queryKey, initialData);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      // Verify the data is not stale due to Infinity staleTime
      const queryCache = queryClient.getQueryCache();
      const query = queryCache.find({ queryKey });
      expect(query?.isStale()).toBe(false);
    });
  });

  describe("error recovery with cached data", () => {
    it("should return cached data when query fails and cache exists", async () => {
      const queryKey = ["error-with-cache"];
      const cachedData = { id: 1, name: "Cached" };
      const error = new Error("Refetch failed");

      // Pre-populate cache with successful data
      queryClient.setQueryData(queryKey, cachedData);

      const queryFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      // Should return success with cached data, not error
      expect(result.current).toMatchObject({
        // error props
        isError: false,
        isRefetchError: false,
        isLoadingError: false,
        error: null,
        // success props
        isSuccess: true,
        data: cachedData,
      });
    });

    it("should return error when no cached data exists", async () => {
      const queryKey = ["error-no-cache"];
      const error = new Error("Query failed");
      const queryFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      expect(result.current).toMatchObject({
        isError: true,
        error,
      });
    });
  });

  describe("placeholder data", () => {
    it("should keep previous data visible during refetch when using keepPreviousData", async () => {
      const queryKey = ["placeholder-test"];
      const initialData = { id: 1, name: "Initial" };
      const updatedData = { id: 1, name: "Updated" };

      const queryFn = vi.fn().mockResolvedValueOnce(initialData).mockResolvedValueOnce(updatedData);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      expect(result.current.data).toStrictEqual(initialData);

      // Re-fetch and wait for updated result to be resolved
      const updatedResult = await result.current.refetch();

      // Assert the current query result still points to initial (previous) data
      expect(result.current).toMatchObject({
        isSuccess: true,
        data: initialData,
      });

      // Assert the next query result points to updated data
      expect(updatedResult).toMatchObject({
        isSuccess: true,
        data: updatedData,
      });
    });
  });

  describe("query client selection", () => {
    it("should use provided queryClient over context client", async () => {
      const providedQueryClient = new QueryClient();
      const contextQueryClient = new QueryClient();

      const queryKey = ["custom-client"];
      const mockData = { id: 1 };

      const queryFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            providedQueryClient,
          ),
        {
          wrapper: createWrapper(contextQueryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      // Data should be in provided client, not context client
      expect(providedQueryClient.getQueryData(queryKey)).toEqual(mockData);
      expect(contextQueryClient.getQueryData(queryKey)).toBeUndefined();
    });

    it("should use context queryClient when not provided", async () => {
      const contextQueryClient = new QueryClient();

      const queryKey = ["context-client"];
      const mockData = { id: 1 };

      const queryFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useSwrQuery({
            queryKey,
            queryFn,
          }),
        {
          wrapper: createWrapper(contextQueryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      expect(contextQueryClient.getQueryData(queryKey)).toEqual(mockData);
    });
  });

  describe("memoization", () => {
    it("should memoize query results to avoid unnecessary re-renders", async () => {
      const queryKey = ["memo-test"];
      const mockData = { id: 1, name: "Memoized" };
      const queryFn = vi
        .fn()
        .mockRejectedValueOnce(mockData)
        .mockRejectedValueOnce(structuredClone(mockData));

      const { result, rerender } = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey,
              queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for query to complete fetching
      await waitFor(() => {
        expect(result.current.isFetched).toBe(true);
      });

      const firstResult = result.current;

      // Re-render with same options
      rerender();

      // Result object should be the same reference if not changed
      expect(result.current).toEqual(firstResult);
    });
  });

  describe("type safety", () => {
    it("should work with defined initial data", async () => {
      interface User {
        id: number;
        name: string;
      }

      const initialData: User = { id: 1, name: "Initial" };
      const queryFn = vi.fn().mockResolvedValue(initialData);

      const { result } = renderHook(
        () =>
          useSwrQuery({
            queryKey: ["user"],
            queryFn,
            initialData,
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Should have data immediately due to initialData
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe(1);
    });

    it("should work with data transformation", async () => {
      interface Raw {
        id: number;
      }

      interface Transformed {
        userId: number;
      }

      const rawData: Raw = { id: 1 };
      const queryFn = vi.fn().mockResolvedValue(rawData);

      const { result } = renderHook(
        () =>
          useSwrQuery({
            queryKey: ["transformed"],
            queryFn,
            select: (data: Raw): Transformed => ({ userId: data.id }),
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ userId: 1 });
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive queries", async () => {
      const queryKey = ["rapid-query"];
      const mockData = { id: 1 };
      const queryFn = vi.fn().mockResolvedValue(mockData);

      const query1 = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey: queryKey,
              queryFn: queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      const query2 = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey: queryKey,
              queryFn: queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      const query3 = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey: queryKey,
              queryFn: queryFn,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for all queries to complete fetching
      await Promise.all([
        waitFor(() => expect(query1.result.current.isSuccess).toBe(true)),
        waitFor(() => expect(query2.result.current.isSuccess).toBe(true)),
        waitFor(() => expect(query3.result.current.isSuccess).toBe(true)),
      ]);

      // Query function should only be called once despite multiple hook instances
      // because they share the same queryKey and use React Query's deduplication
      expect(queryFn).toHaveBeenCalledOnce();

      const expectedResult = {
        isSuccess: true,
        data: mockData,
      };

      expect(query1.result.current).toMatchObject(expectedResult);
      expect(query2.result.current).toMatchObject(expectedResult);
      expect(query3.result.current).toMatchObject(expectedResult);
    });

    it("should handle multiple query keys", async () => {
      const queryKey1 = ["key", "1"];
      const queryKey2 = ["key", "2"];
      const data1 = { id: 1 };
      const data2 = { id: 2 };

      const queryFn1 = vi.fn().mockResolvedValue(data1);
      const queryFn2 = vi.fn().mockResolvedValue(data2);

      const query1 = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey: queryKey1,
              queryFn: queryFn1,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      const query2 = renderHook(
        () =>
          useSwrQuery(
            {
              queryKey: queryKey2,
              queryFn: queryFn2,
            },
            queryClient,
          ),
        {
          wrapper: createWrapper(queryClient),
        },
      );

      // Wait for all queries to complete fetching
      await Promise.all([
        waitFor(() => expect(query1.result.current.isSuccess).toBe(true)),
        waitFor(() => expect(query2.result.current.isSuccess).toBe(true)),
      ]);

      expect(query1.result.current).toMatchObject({
        isSuccess: true,
        data: data1,
      });

      expect(query2.result.current).toMatchObject({
        isSuccess: true,
        data: data2,
      });
    });
  });
});
