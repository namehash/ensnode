import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type EnsRainbow,
  EnsRainbowApiClient,
  EnsRainbowApiClientOptions,
  isCacheableHealResponse,
  isHealError,
  isRetryableHealError,
} from "./client";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient();
    // Reset any mocks between tests
    vi.restoreAllMocks();
  });

  it("should apply default options when no options provided", () => {
    expect(client.getOptions()).toEqual({
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheCapacity: EnsRainbowApiClient.DEFAULT_CACHE_CAPACITY,
      requestTimeout: EnsRainbowApiClient.DEFAULT_REQUEST_TIMEOUT,
    } satisfies EnsRainbowApiClientOptions);
  });

  it("should apply custom options when provided", () => {
    const customEndpointUrl = new URL("http://custom-endpoint.com");
    client = new EnsRainbowApiClient({
      endpointUrl: customEndpointUrl,
      cacheCapacity: 0,
      requestTimeout: 5000,
    });

    expect(client.getOptions()).toEqual({
      endpointUrl: customEndpointUrl,
      cacheCapacity: 0,
      requestTimeout: 5000,
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

  describe("Network error handling", () => {
    it("should handle timeout errors in heal method", async () => {
      // Mock fetch to simulate a timeout error
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const response = await client.heal(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Request timed out",
        errorCode: ErrorCode.TIMEOUT,
      } satisfies EnsRainbow.HealTimeoutError);
    });

    it("should handle network offline errors in heal method", async () => {
      // Mock fetch to simulate a network offline error
      global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const response = await client.heal(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Network connection lost or unavailable",
        errorCode: ErrorCode.NETWORK_OFFLINE,
      } satisfies EnsRainbow.HealNetworkOfflineError);
    });

    it("should handle general network errors in heal method", async () => {
      // Mock fetch to simulate a general network error
      global.fetch = vi.fn().mockRejectedValue(new Error("Some other error"));

      const response = await client.heal(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Some other error",
        errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
      } satisfies EnsRainbow.HealGeneralNetworkError);
    });

    it("should handle timeout errors in count method", async () => {
      // Mock fetch to simulate a timeout error
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const response = await client.count();

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Request timed out",
        errorCode: ErrorCode.TIMEOUT,
      } satisfies EnsRainbow.CountTimeoutError);
    });

    it("should handle network offline errors in count method", async () => {
      // Mock fetch to simulate a network offline error
      global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const response = await client.count();

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Network connection lost or unavailable",
        errorCode: ErrorCode.NETWORK_OFFLINE,
      } satisfies EnsRainbow.CountNetworkOfflineError);
    });

    it("should handle general network errors in count method", async () => {
      // Mock fetch to simulate a general network error
      global.fetch = vi.fn().mockRejectedValue(new Error("Some other error"));

      const response = await client.count();

      expect(response).toEqual({
        status: StatusCode.Error,
        error: "Some other error",
        errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
      } satisfies EnsRainbow.CountNetworkError);
    });

    it("should handle network errors in health method", async () => {
      // Mock fetch to simulate a network error
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const response = await client.health();

      expect(response).toEqual({
        status: "error",
        error: "Network error",
      } satisfies EnsRainbow.HealthResponse);
    });
  });

  describe("Deprecated Network exceptions tests", () => {
    it("should handle connection lost exceptions in heal method", async () => {
      // Mock fetch to simulate a connection lost error
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection lost"));

      // The heal method should return a network error response
      const response = await client.heal(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(response.status).toEqual(StatusCode.Error);
      expect(response.errorCode).toEqual(ErrorCode.GENERAL_NETWORK_ERROR);
    });

    it("should handle connection lost exceptions in count method", async () => {
      // Mock fetch to simulate a connection lost error
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection lost"));

      // The count method should return a network error response
      const response = await client.count();

      expect(response.status).toEqual(StatusCode.Error);
      expect(response.errorCode).toEqual(ErrorCode.GENERAL_NETWORK_ERROR);
    });

    it("should handle connection lost exceptions in health method", async () => {
      // Mock fetch to simulate a connection lost error
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection lost"));

      // The health method should return an error response
      const response = await client.health();

      expect(response.status).toEqual("error");
      expect(response.error).toEqual("Connection lost");
    });
  });

  describe("Real network exceptions (no mocking)", () => {
    it("should handle network errors when connecting to non-existent endpoint", async () => {
      // Create a client with a non-existent endpoint
      const nonExistentClient = new EnsRainbowApiClient({
        endpointUrl: new URL("http://non-existent-domain-that-will-fail.example"),
      });

      // The API call should return a network error response
      const response = await nonExistentClient.health();
      expect(response.status).toEqual("error");
      expect(response.error).toBeTruthy();
    });
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

  it("should consider HealTimeoutError responses to be errors", async () => {
    const response: EnsRainbow.HealTimeoutError = {
      status: StatusCode.Error,
      error: "Request timed out",
      errorCode: ErrorCode.TIMEOUT,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealNetworkOfflineError responses to be errors", async () => {
    const response: EnsRainbow.HealNetworkOfflineError = {
      status: StatusCode.Error,
      error: "Network connection lost or unavailable",
      errorCode: ErrorCode.NETWORK_OFFLINE,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealGeneralNetworkError responses to be errors", async () => {
    const response: EnsRainbow.HealGeneralNetworkError = {
      status: StatusCode.Error,
      error: "Some network error",
      errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
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

  it("should consider HealTimeoutError responses not cacheable", async () => {
    const response: EnsRainbow.HealTimeoutError = {
      status: StatusCode.Error,
      error: "Request timed out",
      errorCode: ErrorCode.TIMEOUT,
    };

    expect(isCacheableHealResponse(response)).toBe(false);
  });

  it("should consider HealNetworkOfflineError responses not cacheable", async () => {
    const response: EnsRainbow.HealNetworkOfflineError = {
      status: StatusCode.Error,
      error: "Network connection lost or unavailable",
      errorCode: ErrorCode.NETWORK_OFFLINE,
    };

    expect(isCacheableHealResponse(response)).toBe(false);
  });

  it("should consider HealGeneralNetworkError responses not cacheable", async () => {
    const response: EnsRainbow.HealGeneralNetworkError = {
      status: StatusCode.Error,
      error: "Some network error",
      errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
    };

    expect(isCacheableHealResponse(response)).toBe(false);
  });
});

describe("RetryableHealError detection", () => {
  it("should consider HealTimeoutError responses retryable", async () => {
    const response: EnsRainbow.HealTimeoutError = {
      status: StatusCode.Error,
      error: "Request timed out",
      errorCode: ErrorCode.TIMEOUT,
    };

    expect(isRetryableHealError(response)).toBe(true);
  });

  it("should consider HealNetworkOfflineError responses retryable", async () => {
    const response: EnsRainbow.HealNetworkOfflineError = {
      status: StatusCode.Error,
      error: "Network connection lost or unavailable",
      errorCode: ErrorCode.NETWORK_OFFLINE,
    };

    expect(isRetryableHealError(response)).toBe(true);
  });

  it("should consider HealGeneralNetworkError responses retryable", async () => {
    const response: EnsRainbow.HealGeneralNetworkError = {
      status: StatusCode.Error,
      error: "Some network error",
      errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
    };

    expect(isRetryableHealError(response)).toBe(true);
  });

  it("should not consider HealNotFoundError responses retryable", async () => {
    const response: EnsRainbow.HealNotFoundError = {
      status: StatusCode.Error,
      error: "Not found",
      errorCode: ErrorCode.NotFound,
    };

    expect(isRetryableHealError(response)).toBe(false);
  });

  it("should not consider HealBadRequestError responses retryable", async () => {
    const response: EnsRainbow.HealBadRequestError = {
      status: StatusCode.Error,
      error: "Bad request",
      errorCode: ErrorCode.BadRequest,
    };

    expect(isRetryableHealError(response)).toBe(false);
  });

  it("should not consider HealServerError responses retryable", async () => {
    const response: EnsRainbow.HealServerError = {
      status: StatusCode.Error,
      error: "Server error",
      errorCode: ErrorCode.ServerError,
    };

    expect(isRetryableHealError(response)).toBe(false);
  });
});
