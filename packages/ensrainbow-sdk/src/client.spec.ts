import { beforeEach, describe, expect, it } from "vitest";
import {
  type EnsRainbow,
  EnsRainbowApiClient,
  EnsRainbowApiClientOptions,
  isCacheableHealResponse,
  isHealError,
} from "./client";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient();
  });

  it("should apply default options when no options provided", () => {
    expect(client.getOptions()).toEqual({
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheCapacity: EnsRainbowApiClient.DEFAULT_CACHE_CAPACITY,
    } satisfies EnsRainbowApiClientOptions);
  });

  it("should apply custom options when provided", () => {
    const customEndpointUrl = new URL("http://custom-endpoint.com");
    client = new EnsRainbowApiClient({
      endpointUrl: customEndpointUrl,
      cacheCapacity: 0,
    });

    expect(client.getOptions()).toEqual({
      endpointUrl: customEndpointUrl,
      cacheCapacity: 0,
    } satisfies EnsRainbowApiClientOptions);
  });

  it("should heal a known labelhash", async () => {
    const response = await client.heal(
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
    );

    expect(response).toEqual({
      status: StatusCode.Success,
      label: "vitalik",
    } satisfies EnsRainbow.HealSuccess);
  });

  it("should return a not found error for an unknown labelhash", async () => {
    const response = await client.heal(
      "0xf64dc17ae2e2b9b16dbcb8cb05f35a2e6080a5ff1dc53ac0bc48f0e79111f264",
    );

    expect(response).toEqual({
      status: StatusCode.Error,
      error: "Label not found",
      errorCode: ErrorCode.NotFound,
    } satisfies EnsRainbow.HealNotFoundError);
  });

  it("should return a bad request error for an invalid labelhash", async () => {
    const response = await client.heal("0xinvalid");

    expect(response).toEqual({
      status: StatusCode.Error,
      error: "Invalid labelhash length 9 characters (expected 66)",
      errorCode: ErrorCode.BadRequest,
    } satisfies EnsRainbow.HealBadRequestError);
  });

  it("should return a count of healable labels", async () => {
    const response = await client.count();

    expect(response satisfies EnsRainbow.CountResponse).toBeTruthy();
    expect(response.status).toEqual(StatusCode.Success);
    expect(typeof response.count === "number").toBeTruthy();
    expect(typeof response.timestamp === "string").toBeTruthy();
  });

  it("should return a positive health check", async () => {
    const response = await client.health();

    expect(response).toEqual({
      status: "ok",
    } satisfies EnsRainbow.HealthResponse);
  });

  it("should return version information", async () => {
    const response = await client.version();

    expect(response satisfies EnsRainbow.VersionResponse).toBeTruthy();
    expect(response.status).toEqual(StatusCode.Success);
    expect(typeof response.versionInfo.version === "string").toBeTruthy();
    expect(typeof response.versionInfo.schema_version === "number").toBeTruthy();
  });
});

describe("HealResponse error detection", () => {
  it("should not consider HealSuccess responses to be errors", async () => {
    const response: EnsRainbow.HealSuccess = {
      status: StatusCode.Success,
      label: "vitalik",
    };

    expect(isHealError(response)).toBe(false);
  });

  it("should consider HealNotFoundError responses to be errors", async () => {
    const response: EnsRainbow.HealNotFoundError = {
      status: StatusCode.Error,
      error: "Not found",
      errorCode: ErrorCode.NotFound,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealBadRequestError responses to be errors", async () => {
    const response: EnsRainbow.HealBadRequestError = {
      status: StatusCode.Error,
      error: "Bad request",
      errorCode: ErrorCode.BadRequest,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealServerError responses to be errors", async () => {
    const response: EnsRainbow.HealServerError = {
      status: StatusCode.Error,
      error: "Server error",
      errorCode: ErrorCode.ServerError,
    };

    expect(isHealError(response)).toBe(true);
  });
});

describe("HealResponse cacheability", () => {
  it("should consider HealSuccess responses cacheable", async () => {
    const response: EnsRainbow.HealSuccess = {
      status: StatusCode.Success,
      label: "vitalik",
    };

    expect(isCacheableHealResponse(response)).toBe(true);
  });

  it("should consider HealNotFoundError responses cacheable", async () => {
    const response: EnsRainbow.HealNotFoundError = {
      status: StatusCode.Error,
      error: "Not found",
      errorCode: ErrorCode.NotFound,
    };

    expect(isCacheableHealResponse(response)).toBe(true);
  });

  it("should consider HealBadRequestError responses cacheable", async () => {
    const response: EnsRainbow.HealBadRequestError = {
      status: StatusCode.Error,
      error: "Bad request",
      errorCode: ErrorCode.BadRequest,
    };

    expect(isCacheableHealResponse(response)).toBe(true);
  });

  it("should consider HealServerError responses not cacheable", async () => {
    const response: EnsRainbow.HealServerError = {
      status: StatusCode.Error,
      error: "Server error",
      errorCode: ErrorCode.ServerError,
    };

    expect(isCacheableHealResponse(response)).toBe(false);
  });
});
