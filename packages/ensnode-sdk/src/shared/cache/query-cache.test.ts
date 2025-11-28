import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Duration } from "../types";
import { QueryClient, swrQuery } from "./query-cache";

describe("Query Cache", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  describe("basic query functionality", () => {
    it("should fetch data successfully", async () => {
      const queryKey = ["test-data"];
      const mockData = { id: 1, name: "Test" };
      const queryFn = vi.fn().mockResolvedValue(mockData);
      const staleTime: Duration = 1;

      const result = await swrQuery(
        {
          queryKey,
          queryFn,
          staleTime,
        },
        queryClient,
      );
      expect(queryFn).toHaveBeenCalledOnce();
      expect(result).toStrictEqual(mockData);
    });

    it("should handle query errors", async () => {
      const queryKey = ["error-test"];
      const error = new Error("Query failed");
      const queryFn = vi.fn().mockRejectedValue(error);
      const staleTime: Duration = 1;

      await expect(
        swrQuery(
          {
            queryKey,
            queryFn,
            staleTime,
          },
          queryClient,
        ),
      ).rejects.toThrowError(error);
    });
  });

  describe("SWR semantics - stale-while-revalidate", () => {
    describe("error recovery with cached data", () => {
      it("should return cached data when query fails and cache exists", async () => {
        const queryKey = ["error-with-cache"];
        const cachedData = { id: 1, name: "Cached" };
        const error = new Error("Refetch failed");

        // Pre-populate cache with successful data
        queryClient.setQueryData(queryKey, cachedData);

        const queryFn = vi.fn().mockRejectedValue(error);
        const staleTime: Duration = 1;

        const result = await swrQuery(
          {
            queryKey,
            queryFn,
            staleTime,
          },
          queryClient,
        );

        // Should return success with cached data, not error
        expect(result).toStrictEqual(cachedData);
      });

      it("should return error when no cached data exists", async () => {
        const queryKey = ["error-no-cache"];
        const error = new Error("Query failed with permanent fetch issues");
        const queryFn = vi.fn().mockRejectedValue(error);
        const staleTime: Duration = 1;

        await expect(
          swrQuery(
            {
              queryKey,
              queryFn,
              staleTime,
            },
            queryClient,
          ),
        ).rejects.toThrowError("Query failed with permanent fetch issues");
      });
    });
  });
});
