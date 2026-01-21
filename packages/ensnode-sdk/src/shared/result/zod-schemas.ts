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
 * Build a schema for a successful result with the given data schema.
 */
export function buildAbstractResultOkSchema<TData>(dataSchema: z.ZodType<TData>) {
  return z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
  });
}

/**
 * Build a schema for a successful result with timestamped data.
 */
export function buildAbstractResultOkTimestampedSchema<TData>(dataSchema: z.ZodType<TData>) {
  return z.object({
    resultCode: z.literal(ResultCodes.Ok),
    data: dataSchema,
    minIndexingCursor: makeUnixTimestampSchema("minIndexingCursor"),
  });
}

/**
 * Build a schema for an error result with the given result code.
 */
export function buildAbstractResultErrorSchema<TResultCode extends ResultCode>(
  resultCode: TResultCode,
) {
  return z.object({
    resultCode: z.literal(resultCode),
    errorMessage: z.string(),
  });
}
/**
 * Build a schema for an error result with the given result code and data schema.
 */
export function buildAbstractResultErrorWithDataSchema<TResultCode extends ResultCode, TData>(
  resultCode: TResultCode,
  dataSchema: z.ZodType<TData>,
) {
  return z.object({
    resultCode: z.literal(resultCode),
    errorMessage: z.string(),
    data: dataSchema,
  });
}

/**
 * Schema for {@link ResultInvalidRequest}.
 */
export const resultErrorInvalidRequestSchema = buildAbstractResultErrorSchema(
  ResultCodes.InvalidRequest,
);

/**
 * Schema for {@link ResultInternalServerError}.
 */
export const resultErrorInternalServerErrorSchema = buildAbstractResultErrorSchema(
  ResultCodes.InternalServerError,
);

/**
 * Schema for {@link ResultServiceUnavailable}.
 */
export const resultErrorServiceUnavailableSchema = buildAbstractResultErrorSchema(
  ResultCodes.ServiceUnavailable,
);

/**
 * Schema for {@link ResultInsufficientIndexingProgressData}.
 */
export const insufficientIndexingProgressDataSchema = z.object({
  indexingStatus: z.string(),
  slowestChainIndexingCursor: makeUnixTimestampSchema("slowestChainIndexingCursor"),
  earliestChainIndexingCursor: makeUnixTimestampSchema("earliestChainIndexingCursor"),
  progressSufficientFrom: z.object({
    indexingStatus: z.string(),
    indexingCursor: makeUnixTimestampSchema("progressSufficientFrom.indexingCursor"),
  }),
});

/**
 * Schema for {@link ResultInsufficientIndexingProgress}.
 */
export const resultErrorInsufficientIndexingProgressSchema = buildAbstractResultErrorWithDataSchema(
  ResultCodes.InsufficientIndexingProgress,
  insufficientIndexingProgressDataSchema,
);
