import { MemoryCache } from "@ensnode/utils/cache";
import { Labelhash } from "@ensnode/utils/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnsRainbowApiClient } from "./client";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";
import type { HealError, HealResponse, HealSuccess } from "./types";

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient();
  });

  it("should apply default options when no options provided", () => {
    expect(client.getOptions()).toEqual({
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
    });
  });

  it("should apply custom options when provided", () => {
    const customEndpointUrl = new URL("http://lb-api.ensrainbow.com");
    client = new EnsRainbowApiClient({ endpointUrl: customEndpointUrl });

    expect(client.getOptions()).toEqual({
      endpointUrl: customEndpointUrl,
    });
  });

  it("should heal a known labelhash", async () => {
    const response = await client.heal(
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
    );

    expect(response).toEqual({
      status: StatusCode.Success,
      label: "vitalik",
    } satisfies HealSuccess);
  });

  it("should return a not found error for an unknown labelhash", async () => {
    const response = await client.heal(
      "0xf64dc17ae2e2b9b16dbcb8cb05f35a2e6080a5ff1dc53ac0bc48f0e79111f264",
    );

    expect(response).toEqual({
      status: StatusCode.Error,
      error: "Label not found",
      errorCode: ErrorCode.NotFound,
    } satisfies HealError);
  });

  it("should cache successful responses if cache enabled", async () => {
    const cache = new MemoryCache<Labelhash, HealResponse>();
    const cacheGetSpy = vi.spyOn(cache, "get");
    const cacheSetSpy = vi.spyOn(cache, "set");

    client = new EnsRainbowApiClient({ cache });
    const labelhash = "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc";

    const response1 = await client.heal(labelhash);
    expect(response1.errorCode).toBeUndefined();

    const response2 = await client.heal(labelhash);
    expect(response1).toEqual(response2);

    expect(response1).toEqual(response2);
    expect(cacheGetSpy).toHaveBeenCalledTimes(2);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  });

  it("should not cache NotFound error responses if cache enabled", async () => {
    const cache = new MemoryCache<Labelhash, HealResponse>();
    const cacheGetSpy = vi.spyOn(cache, "get");
    const cacheSetSpy = vi.spyOn(cache, "set");

    client = new EnsRainbowApiClient({ cache });
    const labelhash = "0x8cf9d002513773dae60129fd694464a16d4f63508f86404c30531a5882a138cd";

    const response1 = await client.heal(labelhash);
    expect(response1.errorCode).toBe(ErrorCode.NotFound);

    const response2 = await client.heal(labelhash);
    expect(response1).toEqual(response2);

    expect(cacheGetSpy).toHaveBeenCalledTimes(2);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  });

  it("should not cache BadRequest error responses if cache enabled", async () => {
    const cache = new MemoryCache<Labelhash, HealResponse>();
    const cacheGetSpy = vi.spyOn(cache, "get");
    const cacheSetSpy = vi.spyOn(cache, "set");

    client = new EnsRainbowApiClient({ cache });
    const labelhash = "0xinvalid";

    const response1 = await client.heal(labelhash);
    expect(response1.errorCode).toBe(ErrorCode.BadRequest);

    const response2 = await client.heal(labelhash);
    expect(response1).toEqual(response2);

    expect(cacheGetSpy).toHaveBeenCalledTimes(2);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  });
});
