import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RESOLUTION_API_URL, ResolutionApiClient } from "./resolution-client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ResolutionApiClient", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("constructor and options", () => {
    it("should use default options when none provided", () => {
      const client = new ResolutionApiClient();
      const options = client.getOptions();

      expect(options.endpointUrl.href).toBe(DEFAULT_RESOLUTION_API_URL + "/");
      expect(options.debug).toBe(false);
    });

    it("should merge provided options with defaults", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new ResolutionApiClient({
        endpointUrl: customUrl,
        debug: true,
      });
      const options = client.getOptions();

      expect(options.endpointUrl.href).toBe(customUrl.href);
      expect(options.debug).toBe(true);
    });

    it("should return frozen options object", () => {
      const client = new ResolutionApiClient();
      const options = client.getOptions();

      expect(Object.isFrozen(options)).toBe(true);
    });
  });

  describe("resolveName", () => {
    it("should make correct API call for basic name resolution", async () => {
      const mockResponse = {
        records: { name: "vitalik.eth" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new ResolutionApiClient();
      const result = await client.resolveName("vitalik.eth", { name: true });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_RESOLUTION_API_URL}/forward/vitalik.eth?name=true`),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle address and text selections", async () => {
      const mockResponse = {
        records: {
          addresses: { "60": "0x1234..." },
          texts: { avatar: "https://..." },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new ResolutionApiClient();
      await client.resolveName("test.eth", {
        addresses: [60, 0],
        texts: ["avatar", "com.twitter"],
      });

      const expectedUrl = new URL(`${DEFAULT_RESOLUTION_API_URL}/forward/test.eth`);
      expectedUrl.searchParams.set("addresses", "60,0");
      expectedUrl.searchParams.set("texts", "avatar,com.twitter");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should include debug parameter when debug is enabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient({ debug: true });
      await client.resolveName("test.eth");

      const expectedUrl = new URL(`${DEFAULT_RESOLUTION_API_URL}/forward/test.eth`);
      expectedUrl.searchParams.set("debug", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle empty selection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient();
      await client.resolveName("test.eth");

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_RESOLUTION_API_URL}/forward/test.eth`),
      );
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Name not found" }),
      });

      const client = new ResolutionApiClient();

      await expect(client.resolveName("nonexistent.eth")).rejects.toThrow(
        "Forward resolution failed: Name not found",
      );
    });

    it("should encode name properly in URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient();
      await client.resolveName("test with spaces.eth");

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_RESOLUTION_API_URL}/forward/test%20with%20spaces.eth`),
      );
    });
  });

  describe("resolveAddress", () => {
    it("should make correct API call for address resolution", async () => {
      const mockResponse = {
        records: { name: "vitalik.eth" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new ResolutionApiClient();
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      const result = await client.resolveAddress(address);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_RESOLUTION_API_URL}/reverse/${address}`),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include chainId parameter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient();
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      await client.resolveAddress(address, 10);

      const expectedUrl = new URL(`${DEFAULT_RESOLUTION_API_URL}/reverse/${address}`);
      expectedUrl.searchParams.set("chainId", "10");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should not include chainId parameter for mainnet (chainId 1)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient();
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      await client.resolveAddress(address, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_RESOLUTION_API_URL}/reverse/${address}`),
      );
    });

    it("should include debug parameter when debug is enabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ResolutionApiClient({ debug: true });
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      await client.resolveAddress(address);

      const expectedUrl = new URL(`${DEFAULT_RESOLUTION_API_URL}/reverse/${address}`);
      expectedUrl.searchParams.set("debug", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Address not found" }),
      });

      const client = new ResolutionApiClient();
      const address = "0x1234567890123456789012345678901234567890";

      await expect(client.resolveAddress(address)).rejects.toThrow(
        "Reverse resolution failed: Address not found",
      );
    });
  });

  describe("defaultOptions", () => {
    it("should return correct default options", () => {
      const options = ResolutionApiClient.defaultOptions();

      expect(options.endpointUrl.href).toBe(DEFAULT_RESOLUTION_API_URL + "/");
      expect(options.debug).toBe(false);
    });
  });
});
