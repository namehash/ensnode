import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnsRainbowApiClient, ErrorCode, StatusCode } from "./index";
import { InvalidLabelhashError } from "./utils";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient({
      endpointUrl: new URL("https://api.ensrainbow.io"),
      cacheCapacity: 10,
    });

    // Reset mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("heal", () => {
    it("should normalize and heal a valid labelhash", async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          status: "success",
          label: "vitalik",
        }),
      });

      const response = await client.heal(
        "AF2CAA1C2CA1D027F1AC823B529D0A67CD144264B2789FA2EA4D63A67C7103CC",
      );

      // Check that the labelhash was normalized (lowercase)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining(
            "/v1/heal/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
          ),
        }),
      );

      expect(response).toEqual({
        status: "success",
        label: "vitalik",
      });
    });

    it("should normalize and heal a valid encoded labelhash", async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          status: "success",
          label: "vitalik",
        }),
      });

      const response = await client.heal(
        "[AF2CAA1C2CA1D027F1AC823B529D0A67CD144264B2789FA2EA4D63A67C7103CC]",
      );

      // Check that the labelhash was normalized (lowercase and without brackets)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining(
            "/v1/heal/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
          ),
        }),
      );

      expect(response).toEqual({
        status: "success",
        label: "vitalik",
      });
    });

    it("should return error response for invalid labelhash", async () => {
      const response = await client.heal("invalid-labelhash");

      expect(response).toEqual({
        status: "error",
        error:
          "Invalid labelhash format: Invalid labelhash: contains non-hex characters: invalid-labelhash",
        errorCode: 400,
      });
    });

    it("should use cache for repeated requests", async () => {
      // Mock successful response for first request
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          status: "success",
          label: "vitalik",
        }),
      });

      // First request should call fetch
      const response1 = await client.heal(
        "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request with same labelhash should use cache
      const response2 = await client.heal(
        "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      );
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(response1).toEqual(response2);
    });
  });
});
