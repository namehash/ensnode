import { describe, expect, it } from "vitest";

import type { ErrorTransient, Result, ResultError, ResultOk } from "./types";
import {
  errorTransient,
  isErrorTransient,
  isResult,
  isResultError,
  isResultOk,
  resultError,
  resultOk,
} from "./utils";

describe("Result type", () => {
  describe("Developer Experience", () => {
    // Correct value codes that the test operation can return.
    const TestOpValueCodes = { Found: "FOUND", NotFound: "NOT_FOUND" } as const;

    // Example of result ok: no records were found for the given request
    interface TestOpResultOkNotFound {
      valueCode: typeof TestOpValueCodes.NotFound;
    }

    // Example of result ok: some records were found for the given request
    interface TestOpResultFound {
      valueCode: typeof TestOpValueCodes.Found;
      records: string[];
    }

    // Union type collecting all ResultOk subtypes
    type TestOpResultOk = TestOpResultOkNotFound | TestOpResultFound;

    // Error codes that the test operation can return.
    const TestOpErrorCodes = {
      InvalidRequest: "INVALID_REQUEST",
      TransientIssue: "TRANSIENT_ISSUE",
    } as const;

    // Example of result error: invalid request
    interface TestOpResultErrorInvalidRequest {
      errorCode: typeof TestOpErrorCodes.InvalidRequest;
      message: string;
    }

    // Example of result error: transient issue, simulates ie. indexing status not ready
    type TestOpResultErrorTransientIssue = ErrorTransient<{
      errorCode: typeof TestOpErrorCodes.TransientIssue;
    }>;

    // Union type collecting all ResultError subtypes
    type TestOpError = TestOpResultErrorInvalidRequest | TestOpResultErrorTransientIssue;

    // Result type for test operation
    type TestOpResult = Result<TestOpResultOk, TestOpError>;

    interface TestOperationParams {
      name: string;
      simulate?: {
        transientIssue?: boolean;
      };
    }

    // An example of operation returning a Result object
    function testOperation(params: TestOperationParams): TestOpResult {
      // Check if need to simulate transient server issue
      if (params.simulate?.transientIssue) {
        return resultError(
          errorTransient({
            errorCode: TestOpErrorCodes.TransientIssue,
          }),
        ) satisfies ResultError<TestOpResultErrorTransientIssue>;
      }

      // Check if request is valid
      if (params.name.endsWith(".eth") === false) {
        return resultError({
          errorCode: TestOpErrorCodes.InvalidRequest,
          message: `Invalid request, 'name' must end with '.eth'. Provided name: '${params.name}'.`,
        }) satisfies ResultError<TestOpResultErrorInvalidRequest>;
      }

      // Check if requested name has any records indexed
      if (params.name !== "vitalik.eth") {
        return resultOk({
          valueCode: TestOpValueCodes.NotFound,
        }) satisfies ResultOk<TestOpResultOkNotFound>;
      }

      // Return records found for the requested name
      return resultOk({
        valueCode: TestOpValueCodes.Found,
        records: ["a", "b", "c"],
      }) satisfies ResultOk<TestOpResultFound>;
    }

    // Example ResultOk values
    const testOperationResultOkFound = testOperation({
      name: "vitalik.eth",
    });

    const testOperationResultOkNotFound = testOperation({
      name: "test.eth",
    });

    // Example ResultError values
    const testOperationResultErrorTransientIssue = testOperation({
      name: "vitalik.eth",
      simulate: {
        transientIssue: true,
      },
    });

    const testOperationResultErrorInvalidRequest = testOperation({
      name: "test.xyz",
    });

    // Example values that are instances of Result type
    const results = [
      testOperationResultOkFound,
      testOperationResultOkNotFound,
      testOperationResultErrorTransientIssue,
      testOperationResultErrorInvalidRequest,
    ];
    // Example values that are not instances of Result type
    const notResults = [null, undefined, 42, "invalid", {}, { resultCode: "unknown" }];

    describe("Type Guards", () => {
      it("should identify Result types correctly", () => {
        for (const maybeResult of results) {
          expect(isResult(maybeResult)).toBe(true);
        }

        for (const maybeResult of notResults) {
          expect(isResult(maybeResult)).toBe(false);
        }
      });

      it("should identify ResultOk types correctly", () => {
        expect(isResultOk(testOperationResultOkFound)).toBe(true);
        expect(isResultOk(testOperationResultOkNotFound)).toBe(true);
        expect(isResultOk(testOperationResultErrorTransientIssue)).toBe(false);
        expect(isResultOk(testOperationResultErrorInvalidRequest)).toBe(false);

        for (const resultOkExample of results.filter((result) => isResultOk(result))) {
          const { value } = resultOkExample;

          switch (value.valueCode) {
            case TestOpValueCodes.Found:
              expect(value).toStrictEqual({
                valueCode: TestOpValueCodes.Found,
                records: ["a", "b", "c"],
              } satisfies TestOpResultFound);
              break;

            case TestOpValueCodes.NotFound:
              expect(value).toStrictEqual({
                valueCode: TestOpValueCodes.NotFound,
              } satisfies TestOpResultOkNotFound);
              break;
          }
        }
      });

      it("should identify ResultError types correctly", () => {
        expect(isResultError(testOperationResultOkFound)).toBe(false);
        expect(isResultError(testOperationResultOkNotFound)).toBe(false);
        expect(isResultError(testOperationResultErrorTransientIssue)).toBe(true);
        expect(isResultError(testOperationResultErrorInvalidRequest)).toBe(true);

        for (const resultErrorExample of results.filter((result) => isResultError(result))) {
          const { value } = resultErrorExample;

          switch (value.errorCode) {
            case TestOpErrorCodes.InvalidRequest:
              expect(value).toStrictEqual({
                errorCode: TestOpErrorCodes.InvalidRequest,
                message: "Invalid request, 'name' must end with '.eth'. Provided name: 'test.xyz'.",
              } satisfies TestOpResultErrorInvalidRequest);
              break;

            case TestOpErrorCodes.TransientIssue:
              expect(value).toMatchObject(
                errorTransient({
                  errorCode: TestOpErrorCodes.TransientIssue,
                }) satisfies TestOpResultErrorTransientIssue,
              );
              break;
          }
        }
      });

      it("should distinguish transient errors correctly", () => {
        expect(isErrorTransient(testOperationResultErrorTransientIssue.value)).toBe(true);
        expect(isErrorTransient(testOperationResultErrorInvalidRequest.value)).toBe(false);
      });
    });
  });
});
