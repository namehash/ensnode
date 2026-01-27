/**
 * This file covers example mock Result objects for each Result type
 * applicable in ENSApi.
 */

import {
  type AbstractResultOk,
  buildResultConnectionError,
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultNotFound,
  buildResultRequestTimeout,
  buildResultServiceUnavailable,
  ResultCodes,
} from "@ensnode/ensnode-sdk";

type TestResultOkData = {
  id: number;
  name: string;
  attributes: Record<string, string>;
};

type TestResultOk = AbstractResultOk<TestResultOkData>;

function buildTestResultOk(data: TestResultOkData): TestResultOk {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

export const mockResultOk = buildTestResultOk({
  id: 1,
  name: "Test",
  attributes: { key: "value" },
});

export const mockResultConnectionError = buildResultConnectionError(
  "Failed to connect to the server",
);

export const mockResultRequestTimeout = buildResultRequestTimeout("The request timed out");

export const mockResultInvalidRequest = buildResultInvalidRequest("Invalid request");

export const mockResultNotFound = buildResultNotFound("Resource not found");

export const mockResultInternalServerError =
  buildResultInternalServerError("Internal server error");

export const mockResultServiceUnavailable = buildResultServiceUnavailable("Service unavailable");

export const mockResultInsufficientIndexingProgress = buildResultInsufficientIndexingProgress(
  "Insufficient indexing progress",
  {
    indexingStatus: "omnichain-backfill",
    slowestChainIndexingCursor: 1620003600,
    earliestChainIndexingCursor: 1620000000,
    progressSufficientFrom: {
      indexingStatus: "realtime",
      chainIndexingCursor: 1620007200,
    },
  },
);
