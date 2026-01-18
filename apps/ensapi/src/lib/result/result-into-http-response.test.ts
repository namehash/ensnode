import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";

import {
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultNotFound,
  buildResultOk,
  buildResultServiceUnavailable,
  ResultCodes,
} from "@ensnode/ensnode-sdk";

import {
  type OpResultServer,
  resultCodeToHttpStatusCode,
  resultIntoHttpResponse,
} from "./result-into-http-response";

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
  it("should return HTTP response with status 200 for Ok result", () => {
    const mockResponse = { status: 200, body: "test" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result: OpResultServer<string> = {
      resultCode: ResultCodes.Ok,
      data: "test data",
    };

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 200);
    expect(response).toBe(mockResponse);
  });

  it("should return HTTP response with status 400 for InvalidRequest result", () => {
    const mockResponse = { status: 400, body: "error" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result = buildResultInvalidRequest("Invalid request");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 400);
    expect(response).toBe(mockResponse);
  });

  it("should return HTTP response with status 404 for NotFound result", () => {
    const mockResponse = { status: 404, body: "not found" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result = buildResultNotFound("Resource not found");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 404);
    expect(response).toBe(mockResponse);
  });

  it("should return HTTP response with status 500 for InternalServerError result", () => {
    const mockResponse = { status: 500, body: "Internal server error" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result = buildResultInternalServerError("Internal server error");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 500);
    expect(response).toBe(mockResponse);
  });

  it("should return HTTP response with status 503 for ServiceUnavailable result", () => {
    const mockResponse = { status: 503, body: "unavailable" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result = buildResultServiceUnavailable("Service unavailable");

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 503);
    expect(response).toBe(mockResponse);
  });

  it("should handle result with complex data object", () => {
    const mockResponse = { status: 200, body: "complex" };
    const mockContext = {
      json: vi.fn().mockReturnValue(mockResponse),
    } as unknown as Context;

    const result = buildResultOk({ id: 1, name: "Test" });

    const response = resultIntoHttpResponse(mockContext, result);

    expect(mockContext.json).toHaveBeenCalledWith(result, 200);
    expect(response).toBe(mockResponse);
  });
});
