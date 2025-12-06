import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeNonNegativeIntegerSchema, makePositiveIntegerSchema } from "../../../internal";
import { RECORDS_PER_PAGE_MAX, RequestPaginationParams } from "./request";
import {
  ResponsePaginationContext,
  ResponsePaginationContextWithNoRecords,
  type ResponsePaginationContextWithRecords,
} from "./response";

/**
 * Schema for {@link RequestPaginationParams}
 */
export const makeRequestPaginationParamsSchema = (valueLabel: string = "RequestPaginationParams") =>
  z.object({
    page: makePositiveIntegerSchema(`${valueLabel}.page`),
    recordsPerPage: makePositiveIntegerSchema(`${valueLabel}.recordsPerPage`).max(
      RECORDS_PER_PAGE_MAX,
      `${valueLabel}.recordsPerPage must not exceed ${RECORDS_PER_PAGE_MAX}`,
    ),
  });

/**
 * Schema for {@link ResponsePaginationContextWithNoRecords}
 */
export const makeResponsePaginationContextSchemaWithNoRecords = (
  valueLabel: string = "ResponsePaginationContextWithNoRecords",
) =>
  z
    .object({
      totalRecords: z.literal(0),
      totalPages: z.literal(1),
      hasNext: z.literal(false),
      hasPrev: z.literal(false),
      startIndex: z.undefined(),
      endIndex: z.undefined(),
    })
    .extend(makeRequestPaginationParamsSchema(valueLabel).shape);

function invariant_responsePaginationWithRecordsIsCorrect(
  ctx: ParsePayload<ResponsePaginationContextWithRecords>,
) {
  const { hasNext, hasPrev, recordsPerPage, page, totalRecords, startIndex, endIndex } = ctx.value;

  const expectedHasNext = page * recordsPerPage < totalRecords;
  if (hasNext !== expectedHasNext) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `hasNext must be equal to '${expectedHasNext ? "true" : "false"}'`,
    });
  }

  const expectedHasPrev = page > 1;
  if (hasPrev !== expectedHasPrev) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `hasPrev must be equal to '${expectedHasPrev ? "true" : "false"}'`,
    });
  }

  if (endIndex < startIndex) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `endIndex must be greater than or equal to startIndex`,
    });
  }

  if (endIndex >= totalRecords) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `endIndex must be lower than totalRecords`,
    });
  }
}

/**
 * Schema for {@link ResponsePaginationContextWithRecords}
 */
export const makeResponsePaginationContextSchemaWithRecords = (
  valueLabel: string = "ResponsePaginationContextWithRecords",
) =>
  z
    .object({
      totalRecords: makeNonNegativeIntegerSchema(`${valueLabel}.totalRecords`),
      totalPages: makePositiveIntegerSchema(`${valueLabel}.totalPages`),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
      startIndex: makeNonNegativeIntegerSchema(`${valueLabel}.startIndex`),
      endIndex: makeNonNegativeIntegerSchema(`${valueLabel}.endIndex`),
    })
    .extend(makeRequestPaginationParamsSchema(valueLabel).shape)
    .check(invariant_responsePaginationWithRecordsIsCorrect);

/**
 * Schema for {@link ResponsePaginationContext}
 */
export const makeResponsePaginationContextSchema = (
  valueLabel: string = "ResponsePaginationContext",
) =>
  z.object({
    paginationContext: z.discriminatedUnion("totalRecords", [
      makeResponsePaginationContextSchemaWithNoRecords(valueLabel),
      makeResponsePaginationContextSchemaWithRecords(valueLabel),
    ]),
  });
