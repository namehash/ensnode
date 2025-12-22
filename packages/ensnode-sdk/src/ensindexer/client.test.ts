import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EnsIndexerClient, EnsIndexerHealthCheckResults } from "./client";
import { mockedConfig, mockedSerializedConfig } from "./config/mocks";

describe("EnsIndexerClient", () => {
  const mockFetch = vi.fn();
  const baseUrl = new URL("http://exmple.com");

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("health()", () => {
    it("should return Ok when fetch returns 2xx status", async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response("ok", {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response("ok", {
            status: 299,
          }),
        );

      const client = new EnsIndexerClient(baseUrl);

      const result1 = await client.health();
      expect(result1).toBe(EnsIndexerHealthCheckResults.Ok);

      const result2 = await client.health();
      expect(result2).toBe(EnsIndexerHealthCheckResults.Ok);
    });

    it("should return NotOk when fetch returns non-2xx status", async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response("bad request", {
            status: 400,
          }),
        )
        .mockResolvedValueOnce(
          new Response("internal server error", {
            status: 500,
          }),
        );

      const client = new EnsIndexerClient(baseUrl);

      const result1 = await client.health();
      expect(result1).toBe(EnsIndexerHealthCheckResults.NotOk);

      const result2 = await client.health();
      expect(result2).toBe(EnsIndexerHealthCheckResults.NotOk);
    });

    it("should return Unknown when fetch throws error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const client = new EnsIndexerClient(baseUrl);
      const result = await client.health();

      expect(result).toBe(EnsIndexerHealthCheckResults.Unknown);
    });

    it("should update internal health state on successful health check", async () => {
      // arrange
      mockFetch
        .mockResolvedValueOnce(
          // `/health` mock
          new Response("ok", {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          // `/api/config` mock
          new Response(JSON.stringify(mockedSerializedConfig), {
            status: 200,
          }),
        );

      const client = new EnsIndexerClient(baseUrl);

      // act
      await client.health();
      const config = await client.config();

      // assert
      expect(config).toStrictEqual(mockedConfig);
    });
  });

  describe("other methods", () => {
    it("should throw when a method called and health check result is Unknown", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const client = new EnsIndexerClient(baseUrl);

      await expect(client.config()).rejects.toThrowError(/Call the 'health\(\)' method first/i);
      await expect(client.indexingStatus()).rejects.toThrowError(
        /Call the 'health\(\)' method first/i,
      );

      await expect(client.health()).resolves.toBe(EnsIndexerHealthCheckResults.Unknown);

      await expect(client.config()).rejects.toThrowError(/ENSIndexer must be healthy/);
      await expect(client.indexingStatus()).rejects.toThrowError(/ENSIndexer must be healthy/);
    });

    it("should throw when a method called and health check result is NotOk", async () => {
      mockFetch.mockResolvedValue(
        new Response("internal server error", {
          status: 500,
        }),
      );

      const client = new EnsIndexerClient(baseUrl);

      await expect(client.config()).rejects.toThrowError(/Call the 'health\(\)' method first/i);
      await expect(client.indexingStatus()).rejects.toThrowError(
        /Call the 'health\(\)' method first/i,
      );

      await expect(client.health()).resolves.toBe(EnsIndexerHealthCheckResults.NotOk);

      await expect(client.config()).rejects.toThrowError(/ENSIndexer must be healthy/);
      await expect(client.indexingStatus()).rejects.toThrowError(/ENSIndexer must be healthy/);
    });
  });
});
