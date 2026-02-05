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
          expect(errorMessage).toContain(
            "Missing required Prometheus metric: ponder_sync_is_complete",
          );
          expect(errorMessage).toContain(
            "Missing required Prometheus metric: ponder_sync_is_realtime",
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
          expect(errorMessage).toContain("'optimism' must be a string representing a chain ID");
          expect(errorMessage).toContain("'mainnet' must be a string representing a chain ID");
          expect(errorMessage).toContain("'base' must be a string representing a chain ID");
          expect(errorMessage).toContain("'scroll' must be a string representing a chain ID");
          expect(errorMessage).toContain("'linea' must be a string representing a chain ID");
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
          /Invalid serialized Ponder Indexing Metrics.*Chain Indexing Metrics cannot have both `indexingCompleted` and `indexingRealtime` as `true`/,
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
});
