import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
} from "../../../shared/zod-schemas";
import { RECORDS_PER_PAGE_MAX, RequestPageParams } from "./request";
import {
  ResponsePageContext,
  ResponsePageContextWithNoRecords,
  type ResponsePageContextWithRecords,
} from "./response";

/**
 * Schema for {@link RequestPageParams}
 */
export const makeRequestPageParamsSchema = (valueLabel: string = "RequestPageParams") =>
  z.object({
    page: makePositiveIntegerSchema(`${valueLabel}.page`),
    recordsPerPage: makePositiveIntegerSchema(`${valueLabel}.recordsPerPage`).max(
      RECORDS_PER_PAGE_MAX,
      `${valueLabel}.recordsPerPage must not exceed ${RECORDS_PER_PAGE_MAX}`,
    ),
  });

/**
 * Schema for {@link ResponsePageContextWithNoRecords}
 */
export const makeResponsePageContextSchemaWithNoRecords = (
  valueLabel: string = "ResponsePageContextWithNoRecords",
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
    .extend(makeRequestPageParamsSchema(valueLabel).shape);

function invariant_responsePageWithRecordsIsCorrect(
  ctx: ParsePayload<ResponsePageContextWithRecords>,
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
 * Schema for {@link ResponsePageContextWithRecords}
 */
export const makeResponsePageContextSchemaWithRecords = (
  valueLabel: string = "ResponsePageContextWithRecords",
) =>
  z
    .object({
      totalRecords: makePositiveIntegerSchema(`${valueLabel}.totalRecords`),
      totalPages: makePositiveIntegerSchema(`${valueLabel}.totalPages`),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
      startIndex: makeNonNegativeIntegerSchema(`${valueLabel}.startIndex`),
      endIndex: makeNonNegativeIntegerSchema(`${valueLabel}.endIndex`),
    })
    .extend(makeRequestPageParamsSchema(valueLabel).shape)
    .check(invariant_responsePageWithRecordsIsCorrect);

/**
 * Schema for {@link ResponsePageContext}
 */
export const makeResponsePageContextSchema = (valueLabel: string = "ResponsePageContext") =>
  z.union([
    makeResponsePageContextSchemaWithNoRecords(valueLabel),
    makeResponsePageContextSchemaWithRecords(valueLabel),
  ]);
