import { describe, expect, it } from "vitest";
import { EnsRainbow, isCacheableHealResponse, isHealError } from "./client";
import { ErrorCode, StatusCode } from "./consts";

describe("HealResponse error detection", () => {
  it("should not consider HealSuccess responses to be errors", async () => {
    const response: EnsRainbow.HealSuccess = {
      status: StatusCode.Success,
      label: "vitalik",
    };

    expect(isHealError(response)).toBe(false);
  });

  it("should consider HealNotFoundError responses to be errors", async () => {
    const response: EnsRainbow.HealError = {
      status: StatusCode.Error,
      error: "Not found",
      errorCode: ErrorCode.NotFound,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealBadRequestError responses to be errors", async () => {
    const response: EnsRainbow.HealError = {
      status: StatusCode.Error,
      error: "Bad request",
      errorCode: ErrorCode.BadRequest,
    };

    expect(isHealError(response)).toBe(true);
  });

  it("should consider HealServerError responses to be errors", async () => {
    const response: EnsRainbow.HealError = {
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
    const response: EnsRainbow.HealError = {
      status: StatusCode.Error,
      error: "Not found",
      errorCode: ErrorCode.NotFound,
    };

    expect(isCacheableHealResponse(response)).toBe(true);
  });

  it("should consider HealBadRequestError responses cacheable", async () => {
    const response: EnsRainbow.HealError = {
      status: StatusCode.Error,
      error: "Bad request",
      errorCode: ErrorCode.BadRequest,
    };

    expect(isCacheableHealResponse(response)).toBe(true);
  });

  it("should consider HealServerError responses not cacheable", async () => {
    const response: EnsRainbow.HealError = {
      status: StatusCode.Error,
      error: "Server error",
      errorCode: ErrorCode.ServerError,
    };

    expect(isCacheableHealResponse(response)).toBe(false);
  });
});
