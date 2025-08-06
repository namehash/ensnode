import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorResponse } from "./api";
import { DEFAULT_ENSNODE_API_URL, ENSNodeClient } from "./client";
import { Name } from "./ens";
import { ResolverRecordsSelection } from "./resolution";

const EXAMPLE_NAME: Name = "example.eth";
const EXAMPLE_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const EXAMPLE_SELECTION = {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
} as const satisfies ResolverRecordsSelection;

const EXAMPLE_RECORDS_RESPONSE = {
  addresses: { 60: EXAMPLE_ADDRESS },
  texts: {
    avatar: "https://example.com/image.jpg",
    "com.twitter": "example",
  },
};

const EXAMPLE_ERROR_RESPONSE: ErrorResponse = { error: "error" };

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

      expect(options).toEqual({ url: new URL(DEFAULT_ENSNODE_API_URL) });
    });

    it("should merge provided options with defaults", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new ENSNodeClient({ url: customUrl });
      const options = client.getOptions();

      expect(options).toEqual({ url: customUrl });
    });

    it("should return frozen options object", () => {
      const client = new ENSNodeClient();
      const options = client.getOptions();

      expect(Object.isFrozen(options)).toBe(true);
    });
  });

  describe("resolveRecords", () => {
    // TODO: integrate with default-case expectations from resolution api and test behavior
    it("should handle address and text selections", async () => {
      const mockResponse = { records: EXAMPLE_RECORDS_RESPONSE };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new ENSNodeClient();
      const response = await client.resolveRecords(EXAMPLE_NAME, EXAMPLE_SELECTION);

      const expectedUrl = new URL(`/api/resolve/records/${EXAMPLE_NAME}`, DEFAULT_ENSNODE_API_URL);
      expectedUrl.searchParams.set("addresses", EXAMPLE_SELECTION.addresses.join(","));
      expectedUrl.searchParams.set("texts", EXAMPLE_SELECTION.texts.join(","));

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new ENSNodeClient();
      await expect(client.resolveRecords(EXAMPLE_NAME, EXAMPLE_SELECTION)).rejects.toThrow(
        /Records Resolution Failed/i,
      );
    });
  });

  describe("resolvePrimaryName", () => {
    it("should make correct API call for primary name resolution", async () => {
      const mockResponse = { records: { name: EXAMPLE_NAME } };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new ENSNodeClient();
      const response = await client.resolvePrimaryName(EXAMPLE_ADDRESS, 1);

      const expectedUrl = new URL(
        `/api/resolve/primary-name/${EXAMPLE_ADDRESS}/1`,
        DEFAULT_ENSNODE_API_URL,
      );

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should include chainId parameter when provided", async () => {
      // TODO: integrate with default-case expectations from resolution api and test behavior

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ records: {} }) });

      const client = new ENSNodeClient();
      await client.resolvePrimaryName(EXAMPLE_ADDRESS, 10);

      const expectedUrl = new URL(
        `/api/resolve/primary-name/${EXAMPLE_ADDRESS}/10`,
        DEFAULT_ENSNODE_API_URL,
      );

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new ENSNodeClient();
      await expect(client.resolvePrimaryName(EXAMPLE_ADDRESS, 1)).rejects.toThrow(
        /Primary Name Resolution Failed/i,
      );
    });
  });
});
