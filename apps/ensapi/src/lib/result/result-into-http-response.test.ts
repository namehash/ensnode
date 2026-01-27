import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockResultInsufficientIndexingProgress,
  mockResultInternalServerError,
  mockResultInvalidRequest,
  mockResultNotFound,
  mockResultOk,
  mockResultServiceUnavailable,
} from "./mocks";
import { resultIntoHttpResponse } from "./result-into-http-response";

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
    const response = resultIntoHttpResponse(mockContext, mockResultOk);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual(mockResultOk);
  });

  it("should return HTTP response with status 400 for InvalidRequest result", async () => {
    const response = resultIntoHttpResponse(mockContext, mockResultInvalidRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual(mockResultInvalidRequest);
  });

  it("should return HTTP response with status 404 for NotFound result", async () => {
    const response = resultIntoHttpResponse(mockContext, mockResultNotFound);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual(mockResultNotFound);
  });

  it("should return HTTP response with status 500 for InternalServerError result", async () => {
    const response = resultIntoHttpResponse(mockContext, mockResultInternalServerError);

    expect(response.status).toBe(500);
    expect(await response.json()).toStrictEqual(mockResultInternalServerError);
  });

  it("should return HTTP response with status 503 for ServiceUnavailable result", async () => {
    const response = resultIntoHttpResponse(mockContext, mockResultServiceUnavailable);
    expect(response.status).toBe(503);
    const responseJson = await response.json();
    expect(responseJson).toStrictEqual(mockResultServiceUnavailable);
  });

  it("should return HTTP response with status 503 for InsufficientIndexingProgress result", async () => {
    const response = resultIntoHttpResponse(mockContext, mockResultInsufficientIndexingProgress);
    expect(response.status).toBe(503);
    const responseJson = await response.json();
    expect(responseJson).toStrictEqual(mockResultInsufficientIndexingProgress);
  });
});
