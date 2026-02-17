import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deserializeEnsIndexerConfigResponse,
  deserializeEnsIndexerIndexingStatusResponse,
  EnsIndexerIndexingStatusResponseCodes,
} from "./api";
import { EnsIndexerClient } from "./client";
import { configResponseMock, indexingStatusResponseMock } from "./client.mock";

// Mock fetch globally (auto-restored by vitest)
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const ENSINDEXER_URL = new URL("http://localhost:42069/");

describe("EnsIndexerClient", () => {
  let client: EnsIndexerClient;

  beforeEach(() => {
    mockFetch.mockClear();

    client = new EnsIndexerClient({ url: ENSINDEXER_URL });
  });

  describe("constructor and options", () => {
    it("should use provided options", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new EnsIndexerClient({ url: customUrl });
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
      const mockedResponse = deserializeEnsIndexerConfigResponse(serializedMockedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializedMockedResponse,
      });

      // act & assert
      await expect(client.config()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("throws an error when the config endpoint returns a non-OK response with a valid error body", async () => {
      // arrange
      const requestUrl = new URL(`/api/config`, ENSINDEXER_URL);
      const errorBody = {
        error: {
          message: "Something went wrong",
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => errorBody,
      });
      // act & assert
      await expect(client.config()).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("throws an 'invalid JSON' error when the config endpoint returns malformed JSON", async () => {
      // arrange
      const requestUrl = new URL(`/api/config`, ENSINDEXER_URL);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token in JSON");
        },
      });
      // act & assert
      await expect(client.config()).rejects.toThrow(/invalid JSON/i);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });
  });

  describe("Indexing Status API", () => {
    it("can fetch overall indexing 'backfill' status object successfully", async () => {
      // arrange
      const requestUrl = new URL(`/api/indexing-status`, ENSINDEXER_URL);
      const serializedMockedResponse = indexingStatusResponseMock;
      const mockedResponse = deserializeEnsIndexerIndexingStatusResponse(serializedMockedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializedMockedResponse,
      });

      // act & assert
      await expect(client.indexingStatus()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("throws on non-OK response with a generic ErrorResponse payload", async () => {
      // arrange
      const requestUrl = new URL(`/api/indexing-status`, ENSINDEXER_URL);
      const errorResponse = { error: "Something went wrong" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });
      // act & assert
      await expect(client.indexingStatus()).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("returns deserialized payload on non-OK response if body is valid indexing-status payload", async () => {
      // arrange
      const requestUrl = new URL(`/api/indexing-status`, ENSINDEXER_URL);
      const errorStatusPayload = {
        responseCode: EnsIndexerIndexingStatusResponseCodes.Error,
      };
      const mockedResponse = deserializeEnsIndexerIndexingStatusResponse(errorStatusPayload);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorStatusPayload,
      });
      // act & assert
      await expect(client.indexingStatus()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });
  });
});
