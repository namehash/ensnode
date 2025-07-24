import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ENSNODE_API_URL, ENSNodeClient } from "./client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ENSNodeClient", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("constructor and options", () => {
    it("should use default options when none provided", () => {
      const client = new ENSNodeClient();
      const options = client.getOptions();

      expect(options.endpointUrl.href).toBe(DEFAULT_ENSNODE_API_URL + "/");
      expect(options.debug).toBe(false);
    });

    it("should merge provided options with defaults", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new ENSNodeClient({
        endpointUrl: customUrl,
        debug: true,
      });
      const options = client.getOptions();

      expect(options.endpointUrl.href).toBe(customUrl.href);
      expect(options.debug).toBe(true);
    });

    it("should return frozen options object", () => {
      const client = new ENSNodeClient();
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

      const client = new ENSNodeClient();
      const result = await client.resolveName("vitalik.eth", { name: true });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_ENSNODE_API_URL}/forward/vitalik.eth?name=true`),
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

      const client = new ENSNodeClient();
      await client.resolveName("test.eth", {
        addresses: [60, 0],
        texts: ["avatar", "com.twitter"],
      });

      const expectedUrl = new URL(`${DEFAULT_ENSNODE_API_URL}/forward/test.eth`);
      expectedUrl.searchParams.set("addresses", "60,0");
      expectedUrl.searchParams.set("texts", "avatar,com.twitter");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should include debug parameter when debug is enabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ENSNodeClient({ debug: true });
      await client.resolveName("test.eth");

      const expectedUrl = new URL(`${DEFAULT_ENSNODE_API_URL}/forward/test.eth`);
      expectedUrl.searchParams.set("debug", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Name not found" }),
      });

      const client = new ENSNodeClient();

      await expect(client.resolveName("nonexistent.eth")).rejects.toThrow(
        "Forward resolution failed: Name not found",
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

      const client = new ENSNodeClient();
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      const result = await client.resolveAddress(address);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL(`${DEFAULT_ENSNODE_API_URL}/reverse/${address}`),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include chainId parameter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: {} }),
      });

      const client = new ENSNodeClient();
      const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
      await client.resolveAddress(address, 10);

      const expectedUrl = new URL(`${DEFAULT_ENSNODE_API_URL}/reverse/${address}`);
      expectedUrl.searchParams.set("chainId", "10");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Address not found" }),
      });

      const client = new ENSNodeClient();
      const address = "0x1234567890123456789012345678901234567890";

      await expect(client.resolveAddress(address)).rejects.toThrow(
        "Reverse resolution failed: Address not found",
      );
    });
  });

  describe("getConfig", () => {
    it("should make correct API call for config", async () => {
      const mockResponse = {
        version: "1.0.0",
        chains: [{ id: 1, name: "Ethereum", enabled: true }],
        features: { resolution: true },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new ENSNodeClient();
      const result = await client.getConfig();

      expect(mockFetch).toHaveBeenCalledWith(new URL(`${DEFAULT_ENSNODE_API_URL}/api/config`));
      expect(result).toEqual(mockResponse);
    });

    it("should include debug parameter when debug is enabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: "1.0.0", chains: [], features: {} }),
      });

      const client = new ENSNodeClient({ debug: true });
      await client.getConfig();

      const expectedUrl = new URL(`${DEFAULT_ENSNODE_API_URL}/api/config`);
      expectedUrl.searchParams.set("debug", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Config unavailable" }),
      });

      const client = new ENSNodeClient();

      await expect(client.getConfig()).rejects.toThrow("Config fetch failed: Config unavailable");
    });
  });

  describe("getStatus", () => {
    it("should make correct API call for indexing status", async () => {
      const mockResponse = {
        currentBlock: 100,
        latestBlock: 100,
        progress: 100,
        status: "synced" as const,
        lastUpdate: "2023-01-01T00:00:00Z",
        chains: [
          {
            id: 1,
            currentBlock: 100,
            latestBlock: 100,
            status: "synced" as const,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new ENSNodeClient();
      const result = await client.getStatus();

      expect(mockFetch).toHaveBeenCalledWith(new URL(`${DEFAULT_ENSNODE_API_URL}/indexing-status`));
      expect(result).toEqual(mockResponse);
    });

    it("should include debug parameter when debug is enabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          currentBlock: 100,
          latestBlock: 100,
          progress: 100,
          status: "synced",
          lastUpdate: "2023-01-01T00:00:00Z",
          chains: [],
        }),
      });

      const client = new ENSNodeClient({ debug: true });
      await client.getStatus();

      const expectedUrl = new URL(`${DEFAULT_ENSNODE_API_URL}/indexing-status`);
      expectedUrl.searchParams.set("debug", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Status unavailable" }),
      });

      const client = new ENSNodeClient();

      await expect(client.getStatus()).rejects.toThrow(
        "Indexing status fetch failed: Status unavailable",
      );
    });
  });

  describe("defaultOptions", () => {
    it("should return correct default options", () => {
      const options = ENSNodeClient.defaultOptions();

      expect(options.endpointUrl.href).toBe(DEFAULT_ENSNODE_API_URL + "/");
      expect(options.debug).toBe(false);
    });
  });
});
