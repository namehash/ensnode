import { describe, expect, it } from "vitest";

import { ResultCodes } from "./result-code";
import {
  buildResultClientUnrecognizedOperationResult,
  buildResultConnectionError,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultNotFound,
  buildResultRequestTimeout,
  isRecognizedResultCodeForOperation,
} from "./result-common";

describe("Result Error Builders", () => {
  describe("buildResultInternalServerError", () => {
    it("should build an internal server error with custom message", () => {
      const result = buildResultInternalServerError("Database connection failed");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InternalServerError,
        errorMessage: "Database connection failed",
        suggestRetry: true,
      });
    });

    it("should build an internal server error with default message when not provided", () => {
      const result = buildResultInternalServerError();

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InternalServerError,
        errorMessage: "An unknown internal server error occurred.",
        suggestRetry: true,
      });
    });

    it("should respect suggestRetry parameter", () => {
      const result = buildResultInternalServerError("Error", false);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InternalServerError,
        errorMessage: "Error",
        suggestRetry: false,
      });
    });
  });

  describe("buildResultNotFound", () => {
    it("should build a not found error with custom message", () => {
      const result = buildResultNotFound("User not found");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.NotFound,
        errorMessage: "User not found",
        suggestRetry: false,
      });
    });

    it("should build a not found error with default message when not provided", () => {
      const result = buildResultNotFound();

      expect(result).toStrictEqual({
        resultCode: ResultCodes.NotFound,
        errorMessage: "Requested resource not found.",
        suggestRetry: false,
      });
    });

    it("should allow retry suggestion for not found errors", () => {
      const result = buildResultNotFound("Not found", true);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.NotFound,
        errorMessage: "Not found",
        suggestRetry: true,
      });
    });
  });

  describe("buildResultInvalidRequest", () => {
    it("should build an invalid request error with custom message", () => {
      const result = buildResultInvalidRequest("Missing required field: email");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InvalidRequest,
        errorMessage: "Missing required field: email",
        suggestRetry: false,
      });
    });

    it("should build an invalid request error with default message when not provided", () => {
      const result = buildResultInvalidRequest();

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InvalidRequest,
        errorMessage: "Invalid request.",
        suggestRetry: false,
      });
    });

    it("should allow retry suggestion for invalid request errors", () => {
      const result = buildResultInvalidRequest("Bad input", true);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.InvalidRequest,
        errorMessage: "Bad input",
        suggestRetry: true,
      });
    });
  });

  describe("buildResultConnectionError", () => {
    it("should build a connection error with custom message", () => {
      const result = buildResultConnectionError("Failed to connect to server");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ConnectionError,
        errorMessage: "Failed to connect to server",
        suggestRetry: true,
      });
    });

    it("should build a connection error with default message when not provided", () => {
      const result = buildResultConnectionError();

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ConnectionError,
        errorMessage: "Connection error.",
        suggestRetry: true,
      });
    });

    it("should respect suggestRetry parameter", () => {
      const result = buildResultConnectionError("Connection failed", false);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ConnectionError,
        errorMessage: "Connection failed",
        suggestRetry: false,
      });
    });
  });

  describe("buildResultRequestTimeout", () => {
    it("should build a request timeout error with custom message", () => {
      const result = buildResultRequestTimeout("Request exceeded 30 second limit");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.RequestTimeout,
        errorMessage: "Request exceeded 30 second limit",
        suggestRetry: true,
      });
    });

    it("should build a request timeout error with default message when not provided", () => {
      const result = buildResultRequestTimeout();

      expect(result).toStrictEqual({
        resultCode: ResultCodes.RequestTimeout,
        errorMessage: "Request timed out.",
        suggestRetry: true,
      });
    });

    it("should respect suggestRetry parameter", () => {
      const result = buildResultRequestTimeout("Timeout", false);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.RequestTimeout,
        errorMessage: "Timeout",
        suggestRetry: false,
      });
    });
  });

  describe("buildResultClientUnrecognizedOperationResult", () => {
    it("should build unrecognized result with default values for unknown input", () => {
      const result = buildResultClientUnrecognizedOperationResult("unknown");

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "An unrecognized result for the operation occurred.",
        suggestRetry: true,
      });
    });

    it("should extract errorMessage from object", () => {
      const unrecognizedResult = { errorMessage: "Custom error message" };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "Custom error message",
        suggestRetry: true,
      });
    });

    it("should extract suggestRetry from object", () => {
      const unrecognizedResult = { suggestRetry: false };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "An unrecognized result for the operation occurred.",
        suggestRetry: false,
      });
    });

    it("should extract both errorMessage and suggestRetry from object", () => {
      const unrecognizedResult = {
        errorMessage: "Custom error",
        suggestRetry: false,
      };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "Custom error",
        suggestRetry: false,
      });
    });

    it("should ignore non-string errorMessage", () => {
      const unrecognizedResult = { errorMessage: 123 };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "An unrecognized result for the operation occurred.",
        suggestRetry: true,
      });
    });

    it("should ignore non-boolean suggestRetry", () => {
      const unrecognizedResult = { suggestRetry: "true" };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "An unrecognized result for the operation occurred.",
        suggestRetry: true,
      });
    });

    it("should handle null input", () => {
      const result = buildResultClientUnrecognizedOperationResult(null);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "An unrecognized result for the operation occurred.",
        suggestRetry: true,
      });
    });

    it("should handle object with extra properties", () => {
      const unrecognizedResult = {
        errorMessage: "Error occurred",
        suggestRetry: false,
        extraField: "ignored",
        nested: { data: "also ignored" },
      };
      const result = buildResultClientUnrecognizedOperationResult(unrecognizedResult);

      expect(result).toStrictEqual({
        resultCode: ResultCodes.ClientUnrecognizedOperationResult,
        errorMessage: "Error occurred",
        suggestRetry: false,
      });
    });
  });

  describe("isRecognizedResultCodeForOperation", () => {
    const recognizedCodes = [
      ResultCodes.InternalServerError,
      ResultCodes.NotFound,
      ResultCodes.InvalidRequest,
    ] as const;

    it("should return true for recognized result code", () => {
      expect(
        isRecognizedResultCodeForOperation(ResultCodes.InternalServerError, recognizedCodes),
      ).toBe(true);
    });

    it("should return false for unrecognized result code", () => {
      expect(isRecognizedResultCodeForOperation(ResultCodes.ConnectionError, recognizedCodes)).toBe(
        false,
      );
    });

    it("should return false for unknown string result codes", () => {
      expect(isRecognizedResultCodeForOperation("UnknownCode", recognizedCodes)).toBe(false);
    });

    it("should handle empty recognized codes array", () => {
      expect(isRecognizedResultCodeForOperation(ResultCodes.InternalServerError, [])).toBe(false);
    });

    it("should handle all result codes in recognized list", () => {
      const allCodes = [
        ResultCodes.InternalServerError,
        ResultCodes.NotFound,
        ResultCodes.InvalidRequest,
        ResultCodes.ConnectionError,
        ResultCodes.RequestTimeout,
        ResultCodes.ClientUnrecognizedOperationResult,
      ] as const;

      allCodes.forEach((code) => {
        expect(isRecognizedResultCodeForOperation(code, allCodes)).toBe(true);
      });
    });
  });
});
