import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildPonderStatus } from "./api/status";
import type { ChainId } from "./chain";
import { PonderClient } from "./client";
import {
  invalidPonderStatusResponseNegativeBlockNumber,
  validPonderStatusResponse,
  validPonderStatusResponseMinimal,
} from "./mocks";
import type { PonderStatusResponse } from "./ponder-status";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper function to extract indexed chain IDs from a mocked PonderStatusResponse
const getIndexedChainIds = (response: PonderStatusResponse): Set<ChainId> =>
  new Set(Object.values(response).map((chain) => chain.id));

describe("Ponder Client", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("status()", () => {
    it("should handle valid Ponder status response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => validPonderStatusResponse });

      const indexedChainIds = getIndexedChainIds(validPonderStatusResponse);
      const ponderClient = new PonderClient(new URL("http://localhost:3000"), indexedChainIds);

      // Act
      const status = await ponderClient.status();

      // Assert
      expect(status).toEqual(buildPonderStatus(validPonderStatusResponse));
    });

    describe("Invalid response handling", () => {
      it("should handle invalid block numbers in the response", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => invalidPonderStatusResponseNegativeBlockNumber,
        });

        const indexedChainIds = getIndexedChainIds(invalidPonderStatusResponseNegativeBlockNumber);
        const ponderClient = new PonderClient(new URL("http://localhost:3000"), indexedChainIds);

        expect(ponderClient.status()).rejects.toThrowError(
          /Invalid Ponder status response.*Value must be a non-negative integer/,
        );
      });

      it("should handle indexed chain IDs that are not present in the response", async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => validPonderStatusResponseMinimal,
        });

        // Set indexed chain IDs to be a wider set than the chains present in the response
        const indexedChainIds = getIndexedChainIds(validPonderStatusResponse);
        const ponderClient = new PonderClient(new URL("http://localhost:3000"), indexedChainIds);

        // Act & Assert
        await expect(ponderClient.status()).rejects.toThrowError(
          /Ponder Status response is missing status for indexed chain IDs: 10, 8453, 42161, 59144, 534352/,
        );
      });
    });
  });
});
