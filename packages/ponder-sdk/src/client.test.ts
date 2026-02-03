import { beforeEach, describe, expect, it, vi } from "vitest";

import { PonderClient } from "./client";
import { invalidPonderStatusResponse, validPonderStatusResponse } from "./mocks";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Ponder Client", () => {
  let ponderClient: PonderClient;

  beforeEach(() => {
    mockFetch.mockClear();
    ponderClient = new PonderClient(new URL("https://example.com"));
  });

  describe("status()", () => {
    it("should handle valid Ponder status response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => validPonderStatusResponse });

      const status = await ponderClient.status();

      expect(status).toEqual(validPonderStatusResponse);
    });

    it("should handle invalid Ponder status response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => invalidPonderStatusResponse });

      expect(ponderClient.status()).rejects.toThrowError(/Invalid Ponder status response/);
    });
  });
});
