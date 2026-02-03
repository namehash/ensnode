import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PonderClient } from "./client";
import { deserializePonderIndexingStatus } from "./deserialize/indexing-status";
import {
  mockSerializedPonderIndexingStatusInvalidBlockNumber,
  mockSerializedPonderIndexingStatusInvalidChainId,
  mockSerializedPonderIndexingStatusValid,
} from "./mocks";

// Mock Fetch API
const mockFetch = vi.fn<typeof fetch>();

describe("Ponder Client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
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
          /Failed to fetch Ponder Indexing Status/,
        );
      });
    });
  });
});
