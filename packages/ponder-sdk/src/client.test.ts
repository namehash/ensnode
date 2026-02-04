import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PonderClient } from "./client";
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
