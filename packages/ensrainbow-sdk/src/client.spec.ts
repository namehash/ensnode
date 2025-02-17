import { beforeEach, describe, expect, it } from "vitest";
import { EnsRainbowApiClient, EnsRainbowApiClientOptions } from "./client";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";
import type {
  CountResponse,
  CountSuccess,
  HealBadRequestError,
  HealNotFoundError,
  HealSuccess,
  HealthResponse
} from "./types";

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
    } satisfies HealNotFoundError);
  });

  it("should return a bad request error for an invalid labelhash", async () => {
    const response = await client.heal("0xinvalid");

    expect(response).toEqual({
      status: StatusCode.Error,
      error: "Invalid labelhash length 9 characters (expected 66)",
      errorCode: ErrorCode.BadRequest,
    } satisfies HealBadRequestError);
  });

  it("should return a count of healable labels", async () => {
    const response = await client.count();

    expect(response satisfies CountResponse).toBeTruthy();
    expect(response.status).toEqual(StatusCode.Success);
    expect(typeof response.count === "number").toBeTruthy();
    expect(typeof response.timestamp === "string").toBeTruthy();
  });

  it("should return a positive health check", async () => {
    const response = await client.health();

    expect(response).toEqual({
      status: "ok"
    } satisfies HealthResponse);
  });
});
