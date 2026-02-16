import { beforeEach, describe, expect, it, vi } from "vitest";

import { deserializeConfigResponse, deserializeIndexingStatusResponse } from "./api";
import { ENSIndexerClient } from "./client";
import { configResponseMock, indexingStatusResponseMock } from "./client.mock";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const ENSINDEXER_URL = new URL("http://localhost:42069/");

describe("ENSIndexerClient", () => {
  let client: ENSIndexerClient;

  beforeEach(() => {
    mockFetch.mockClear();

    client = new ENSIndexerClient({ url: ENSINDEXER_URL });
  });

  describe("constructor and options", () => {
    it("should use provided options", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new ENSIndexerClient({ url: customUrl });
      const options = client.getOptions();

      expect(options).toEqual({ url: customUrl });
    });

    it("should return frozen options object", () => {
      const options = client.getOptions();

      expect(Object.isFrozen(options)).toBe(true);
    });
  });

  describe("Config API", () => {
    it("can fetch config object successfully", async () => {
      // arrange
      const requestUrl = new URL(`/api/config`, ENSINDEXER_URL);
      const serializedMockedResponse = configResponseMock;
      const mockedResponse = deserializeConfigResponse(serializedMockedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializedMockedResponse,
      });

      // act & assert
      await expect(client.config()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });
  });

  describe("Indexing Status API", () => {
    it("can fetch overall indexing 'backfill' status object successfully", async () => {
      // arrange
      const requestUrl = new URL(`/api/indexing-status`, ENSINDEXER_URL);
      const serializedMockedResponse = indexingStatusResponseMock;
      const mockedResponse = deserializeIndexingStatusResponse(serializedMockedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializedMockedResponse,
      });

      // act & assert
      await expect(client.indexingStatus()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });
  });
});
