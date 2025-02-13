import { beforeEach, describe, expect, it } from "vitest";
import { EnsRainbowApiClient } from "./client";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";
import type { HealError, HealSuccess } from "./types";

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient();
  });

  it("should apply default options when no options provided", () => {
    expect(client.getOptions()).toEqual({
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheSize: EnsRainbowApiClient.DEFAULT_CACHE_SIZE,
    });
  });

  it("should apply custom options when provided", () => {
    const customEndpointUrl = new URL("http://lb-api.ensrainbow.com");
    client = new EnsRainbowApiClient({
      endpointUrl: customEndpointUrl,
      cacheSize: 0,
    });

    expect(client.getOptions()).toEqual({
      endpointUrl: customEndpointUrl,
      cacheSize: 0,
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

  it("should only cache heal responses that are safe to cache", async () => {
    expect(
      EnsRainbowApiClient.isCacheableHealResponse({
        status: StatusCode.Success,
        label: "vitalik",
      }),
    ).toBe(true);

    expect(
      EnsRainbowApiClient.isCacheableHealResponse({
        status: StatusCode.Error,
        error: "Not found",
        errorCode: ErrorCode.NotFound,
      }),
    ).toBe(true);

    expect(
      EnsRainbowApiClient.isCacheableHealResponse({
        status: StatusCode.Error,
        error: "Bad request",
        errorCode: ErrorCode.BadRequest,
      }),
    ).toBe(true);

    expect(
      EnsRainbowApiClient.isCacheableHealResponse({
        status: StatusCode.Error,
        error: "Server error",
        errorCode: ErrorCode.ServerError,
      }),
    ).toBe(false);
  });
});
