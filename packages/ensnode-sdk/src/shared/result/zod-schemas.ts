import z from "zod/v4";

import type { AbstractResultError, AbstractResultOk, AbstractResultOkTimestamped } from "../result";
import { makeUnixTimestampSchema } from "../zod-schemas";
import { type ResultCode, ResultCodes } from "./result-code";
import type {
  ResultInsufficientIndexingProgress,
  ResultInsufficientIndexingProgressData,
  ResultInternalServerError,
  ResultInvalidRequest,
  ResultServiceUnavailable,
} from "./result-common";

/**
 * Schema for {@link AbstractResultOk}.
 */
export const makeAbstractResultOkSchema = <TData>(dataSchema: z.ZodType<TData>) =>
  z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
  });

/**
 * Schema for {@link AbstractResultOkTimestamped}.
 */
export const makeAbstractResultOkTimestampedSchema = <TData>(dataSchema: z.ZodType<TData>) =>
  z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
    minIndexingCursor: makeUnixTimestampSchema("minIndexingCursor"),
  });

/**
 * Schema for {@link AbstractResultError}.
 */
export const makeAbstractResultErrorSchema = <TResultCode extends ResultCode>(
  resultCode: TResultCode,
) =>
  z.object({
    resultCode: z.literal(resultCode),
    data: z.object({
      errorMessage: z.string(),
      suggestRetry: z.boolean(),
    }),
  });

/**
 * Schema for {@link AbstractResultError} with data.
 */
export const makeAbstractResultErrorWithDataSchema = <TResultCode extends ResultCode>(
  resultCode: TResultCode,
  dataSchema: z.ZodObject,
) => {
  const abstractResultErrorShape = makeAbstractResultErrorSchema(resultCode).shape;

  return z.object({
    resultCode: abstractResultErrorShape.resultCode,
    data: abstractResultErrorShape.data.extend(dataSchema.shape),
  });
};

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
    currentIndexingStatus: z.string(),
    currentIndexingCursor: makeUnixTimestampSchema("currentIndexingCursor"),
    startIndexingCursor: makeUnixTimestampSchema("startIndexingCursor"),
    targetIndexingStatus: z.string(),
    targetIndexingCursor: makeUnixTimestampSchema("targetIndexingCursor"),
  });

/**
 * Schema for {@link ResultInsufficientIndexingProgress}.
 */
export const makeResultErrorInsufficientIndexingProgressSchema = () =>
  makeAbstractResultErrorWithDataSchema(
    ResultCodes.InsufficientIndexingProgress,
    makeResultErrorInsufficientIndexingProgressDataSchema(),
  );
