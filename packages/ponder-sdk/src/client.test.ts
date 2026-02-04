import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PonderClient } from "./client";
import {
  indexingMetricsMockInvalidApplicationSettingsOrdering,
  indexingMetricsMockInvalidNoIndexedChains,
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
      it("should handle invalid Ponder application settings in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidApplicationSettingsOrdering.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        // Act & Assert
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Metrics.*Invalid input: expected "omnichain"/,
        );
      });

      it("should handle no indexed chains in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(
          new Response(indexingMetricsMockInvalidNoIndexedChains.text, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );

        // Act & Assert
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        await expect(ponderClient.metrics()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Metrics.*Ponder Indexing Metrics must include at least one indexed chain/,
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
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(mockSerializedPonderIndexingStatusInvalidBlockNumber), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        await expect(ponderClient.status()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Status.*Value must be a non-negative integer/,
        );
      });

      it("should handle invalid chain IDs in the response", async () => {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(mockSerializedPonderIndexingStatusInvalidChainId), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

        await expect(ponderClient.status()).rejects.toThrowError(
          /Invalid serialized Ponder Indexing Status.*Value must be a positive integer/,
        );
      });

      it("should handle zero indexed chains in the response", async () => {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

        const ponderClient = new PonderClient(new URL("http://localhost:3000"));

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
        mockFetch.mockResolvedValueOnce(
          new Response("not valid json", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
        const ponderClient = new PonderClient(new URL("http://localhost:3000"));
        await expect(ponderClient.status()).rejects.toThrowError(
          /Failed to parse Ponder Indexing Status response as JSON/,
        );
      });
    });
  });
});
