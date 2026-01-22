import z from "zod/v4";

import { makeUnixTimestampSchema } from "../zod-schemas";
import { type ResultCode, ResultCodes } from "./result-code";
import {
  ResultInsufficientIndexingProgress,
  ResultInsufficientIndexingProgressData,
  ResultInternalServerError,
  ResultInvalidRequest,
  ResultServiceUnavailable,
} from "./result-common";

/**
 * Schema for a successful result with the given data schema.
 */
export const makeAbstractResultOkSchema = <TData>(dataSchema: z.ZodType<TData>) =>
  z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
  });

/**
 * Schema for a successful result with timestamped data.
 */
export const makeAbstractResultOkTimestampedSchema = <TData>(dataSchema: z.ZodType<TData>) =>
  z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
    minIndexingCursor: makeUnixTimestampSchema("minIndexingCursor"),
  });

/**
 * Schema for an error result with the given result code.
 */
export const makeAbstractResultErrorSchema = <TResultCode extends ResultCode>(
  resultCode: TResultCode,
) =>
  z.object({
    resultCode: z.literal(resultCode),
    errorMessage: z.string(),
  });

/**
 * Schema for an error result with the given result code and data schema.
 */
export const makeAbstractResultErrorWithDataSchema = <TResultCode extends ResultCode, TData>(
  resultCode: TResultCode,
  dataSchema: z.ZodType<TData>,
) =>
  z.object({
    resultCode: z.literal(resultCode),
    errorMessage: z.string(),
    data: dataSchema,
  });

/**
 * Schema for {@link ResultInvalidRequest}.
 */
export const makeResultErrorInvalidRequestSchema = () =>
  makeAbstractResultErrorSchema(ResultCodes.InvalidRequest);

/**
 * Schema for {@link ResultInternalServerError}.
 */
export const makeResultErrorInternalServerErrorSchema = () =>
  makeAbstractResultErrorSchema(ResultCodes.InternalServerError);

/**
 * Schema for {@link ResultServiceUnavailable}.
 */
export const makeResultErrorServiceUnavailableSchema = () =>
  makeAbstractResultErrorSchema(ResultCodes.ServiceUnavailable);

/**
 * Schema for {@link ResultInsufficientIndexingProgressData}.
 */
export const makeResultErrorInsufficientIndexingProgressDataSchema = () =>
  z.object({
    indexingStatus: z.string(),
    slowestChainIndexingCursor: makeUnixTimestampSchema("slowestChainIndexingCursor"),
    earliestChainIndexingCursor: makeUnixTimestampSchema("earliestChainIndexingCursor"),
    progressSufficientFrom: z.object({
      indexingStatus: z.string(),
      chainIndexingCursor: makeUnixTimestampSchema("progressSufficientFrom.chainIndexingCursor"),
    }),
  });

/**
 * Schema for {@link ResultInsufficientIndexingProgress}.
 */
export const makeResultErrorInsufficientIndexingProgressSchema = () =>
  makeAbstractResultErrorWithDataSchema(
    ResultCodes.InsufficientIndexingProgress,
    makeResultErrorInsufficientIndexingProgressDataSchema(),
  );
