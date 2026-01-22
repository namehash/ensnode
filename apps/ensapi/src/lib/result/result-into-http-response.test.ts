import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultNotFound,
  buildResultServiceUnavailable,
  ResultCodes,
} from "@ensnode/ensnode-sdk";

import { resultCodeToHttpStatusCode, resultIntoHttpResponse } from "./result-into-http-response";

describe("resultCodeToHttpStatusCode", () => {
  it("should return 200 for ResultCodes.Ok", () => {
    const statusCode = resultCodeToHttpStatusCode(ResultCodes.Ok);

    expect(statusCode).toBe(200);
  });

  it("should return 400 for ResultCodes.InvalidRequest", () => {
    const statusCode = resultCodeToHttpStatusCode(ResultCodes.InvalidRequest);

    expect(statusCode).toBe(400);
  });

  it("should return 404 for ResultCodes.NotFound", () => {
    const statusCode = resultCodeToHttpStatusCode(ResultCodes.NotFound);

    expect(statusCode).toBe(404);
  });

  it("should return 500 for ResultCodes.InternalServerError", () => {
    const statusCode = resultCodeToHttpStatusCode(ResultCodes.InternalServerError);

    expect(statusCode).toBe(500);
  });

  it("should return 503 for ResultCodes.ServiceUnavailable", () => {
    const statusCode = resultCodeToHttpStatusCode(ResultCodes.ServiceUnavailable);

    expect(statusCode).toBe(503);
  });
});

describe("resultIntoHttpResponse", () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      json: vi.fn((object: Response, status: ContentfulStatusCode) => {
        return Response.json(object, { status });
      }),
    } as unknown as Context;
  });

  it("should return HTTP response with status 200 for Ok result", async () => {
    const result = { resultCode: ResultCodes.Ok, data: "test data" };

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(result);
  });

  it("should return HTTP response with status 400 for InvalidRequest result", async () => {
    const result = buildResultInvalidRequest("Invalid request");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual(result);
  });

  it("should return HTTP response with status 404 for NotFound result", async () => {
    const result = buildResultNotFound("Resource not found");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual(result);
  });

  it("should return HTTP response with status 500 for InternalServerError result", async () => {
    const result = buildResultInternalServerError("Internal server error");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(500);
    expect(await response.json()).toStrictEqual(result);
  });

  it("should return HTTP response with status 503 for ServiceUnavailable result", async () => {
    const result = buildResultServiceUnavailable("Service unavailable");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(503);
    const responseJson = await response.json();
    expect(responseJson).toStrictEqual(result);
  });

  it("should return HTTP response with status 503 for InsufficientIndexingProgress result", async () => {
    const result = buildResultInsufficientIndexingProgress("Insufficient indexing progress", {
      indexingStatus: "omnichain-backfill",
      slowestChainIndexingCursor: 1620003600,
      earliestChainIndexingCursor: 1620000000,
      progressSufficientFrom: {
        indexingStatus: "realtime",
        chainIndexingCursor: 1620007200,
      },
    });

    const response = resultIntoHttpResponse(mockContext, result);

    expect(response.status).toBe(503);
    const responseJson = await response.json();
    expect(responseJson).toStrictEqual(result);
  });

  it("should handle result with complex data object", async () => {
    const complexData = { id: 1, name: "Test", attributes: { key: "value" } };
    const result = { resultCode: ResultCodes.Ok, data: complexData };

    const response = resultIntoHttpResponse(mockContext, result);
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(result);
  });
});
