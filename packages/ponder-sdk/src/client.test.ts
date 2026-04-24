import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PonderClient } from "./client";
import {
  indexingMetricsMockInvalidApplicationSettingsOrdering,
  indexingMetricsMockInvalidConflictingMetrics,
  indexingMetricsMockInvalidNoIndexedChains,
  indexingMetricsMockInvalidNonIntegerChainNames,
  indexingMetricsMockValid,
} from "./deserialize/indexing-metrics.mock";
import { deserializePonderIndexingStatus } from "./deserialize/indexing-status";
import {
  mockSerializedPonderIndexingStatusInvalidBlockNumber,
  mockSerializedPonderIndexingStatusInvalidChainId,
  mockSerializedPonderIndexingStatusValid,
} from "./deserialize/indexing-status.mock";

// Mock Fetch API
const mockFetch = vi.fn<typeof fetch>();

describe("Ponder Client", () => {
  beforeAll(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe("health()", () => {
    it("should handle healthy response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        new Response(null, {
          status: 200,
        }),
      );

      const ponderClient = new PonderClient(new URL("http://localhost:3000"));

      // Act & Assert
      await expect(ponderClient.health()).resolves.toBeUndefined();
    });

    it("should handle unhealthy response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        new Response("Service Unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        }),
      );

      const ponderClient = new PonderClient(new URL("http://localhost:3000"));

      // Act & Assert
      await expect(ponderClient.health()).rejects.toThrowError(
        /Failed to fetch Ponder health response/,
      );
    });
  });

  describe("metrics()", () => {
    it("should handle valid Ponder metrics response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        new Response(indexingMetricsMockValid.text, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      );

      const ponderClient = new PonderClient(new URL("http://localhost:3000"));

      // Act & Assert
      await expect(ponderClient.metrics()).resolves.toStrictEqual(
        indexingMetricsMockValid.deserialized,
      );
    });

    describe("Invalid response handling", () => {
      it("should handle empty response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response("", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Metrics.*Ponder Indexing Metrics must be a non-empty string/,
        );
      });

      it("should handle invalid Ponder application settings in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidApplicationSettingsOrdering.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act
        try {
          await ponderClient.metrics();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "unknown error";
          // Assert
          expect(errorMessage).toContain("Invalid serialized Ponder Indexing Metrics");
          expect(errorMessage).toContain("Missing required Prometheus metric: ponder_sync_block");
          expect(errorMessage).toContain(
            "Missing required Prometheus metric: ponder_sync_block_timestamp",
          );
          expect(errorMessage).toContain(
            "Missing required Prometheus metric: ponder_historical_total_blocks",
          );
        }
      });

      it("should handle metrics using non-int chain names in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidNonIntegerChainNames.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act
        try {
          await ponderClient.metrics();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "unknown error";
          // Assert
          expect(errorMessage).toContain("Invalid serialized Ponder Indexing Metrics");
          expect(errorMessage).toContain(
            "metric must be a string representing a valid ChainId, but got: 'optimism'",
          );
          expect(errorMessage).toContain(
            "metric must be a string representing a valid ChainId, but got: 'mainnet'",
          );
          expect(errorMessage).toContain(
            "metric must be a string representing a valid ChainId, but got: 'base'",
          );
          expect(errorMessage).toContain(
            "metric must be a string representing a valid ChainId, but got: 'scroll'",
          );
          expect(errorMessage).toContain(
            "metric must be a string representing a valid ChainId, but got: 'linea'",
          );
        }
      });

      it("should handle no indexed chains in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidNoIndexedChains.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Metrics.*Missing required Prometheus metric: ponder_sync_block/,
        );
      });

      it("should handle conflicting metrics in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidConflictingMetrics.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Metrics.*'ponder_sync_is_complete' and 'ponder_sync_is_realtime' metrics cannot both be 1 at the same time for chain 10/,
        );
      });
    });

    describe("HTTP error handling", () => {
      it("should handle non-OK HTTP responses", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          }),
        );
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Failed to fetch Ponder Indexing Metrics response/,
        );
      });
    });
  });

  describe("status()", () => {
    it("should handle valid Ponder status response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockSerializedPonderIndexingStatusValid), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const ponderClient = new PonderClient(new URL("http://localhost:3000"));

      // Act & Assert
      await expect(ponderClient.status()).resolves.toStrictEqual(
        deserializePonderIndexingStatus(mockSerializedPonderIndexingStatusValid),
      );
    });

    describe("Invalid response handling", () => {
      it("should handle invalid block numbers in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(mockSerializedPonderIndexingStatusInvalidBlockNumber), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Status.*Value must be a non-negative integer/,
        );
      });

      it("should handle invalid chain IDs in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(mockSerializedPonderIndexingStatusInvalidChainId), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Status.*Value must be a positive integer/,
        );
      });

      it("should handle zero indexed chains in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Status.*Ponder Indexing Status must include at least one indexed chain/,
        );
      });
    });

    describe("HTTP error handling", () => {
      it("should handle non-OK HTTP responses", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          }),
        );
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Failed to fetch Ponder Indexing Status response/,
        );
      });

      it("should handle JSON parsing errors", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response("not valid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Failed to parse Ponder Indexing Status response as JSON/,
        );
      });
    });
  });

  describe("getAbortSignal getter", () => {
    it("invokes getAbortSignal on every fetch and forwards the signal", async () => {
      // Arrange
      mockFetch.mockResolvedValue(new Response(null, { status: 200 }));
      const signal = new AbortController().signal;
      const getAbortSignal = vi.fn(() => signal);
      const ponderClient = new PonderClient(new URL("http://localhost:3000"), getAbortSignal);

      // Act
      await ponderClient.health();
      await ponderClient.health();

      // Assert
      expect(getAbortSignal).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.any(URL), { signal });
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.any(URL), { signal });
    });

    it("re-reads the signal between fetches so callers get fresh identity", async () => {
      // Arrange
      mockFetch.mockResolvedValue(new Response(null, { status: 200 }));
      const firstSignal = new AbortController().signal;
      const secondSignal = new AbortController().signal;
      const getAbortSignal = vi
        .fn<() => AbortSignal | undefined>()
        .mockReturnValueOnce(firstSignal)
        .mockReturnValueOnce(secondSignal);
      const ponderClient = new PonderClient(new URL("http://localhost:3000"), getAbortSignal);

      // Act
      await ponderClient.health();
      await ponderClient.health();

      // Assert
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.any(URL), { signal: firstSignal });
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.any(URL), { signal: secondSignal });
    });

    it("aborting the signal cancels in-flight fetches", async () => {
      // Arrange
      const abortController = new AbortController();
      mockFetch.mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            });
          }),
      );
      const ponderClient = new PonderClient(
        new URL("http://localhost:3000"),
        () => abortController.signal,
      );

      // Act
      const pending = ponderClient.health();
      abortController.abort();

      // Assert
      await expect(pending).rejects.toThrowError(/aborted/);
    });

    it("treats getAbortSignal as optional (undefined signal → no abort)", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
      const ponderClient = new PonderClient(new URL("http://localhost:3000"));

      // Act
      await ponderClient.health();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(expect.any(URL), { signal: undefined });
    });
  });
});
