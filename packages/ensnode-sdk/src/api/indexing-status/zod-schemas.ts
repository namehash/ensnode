import z from "zod/v4";

import { makeRealtimeIndexingStatusProjectionSchema } from "../../internal";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
} from "./response";

/**
 * Schema for {@link IndexingStatusResponseOk}
 **/
export const makeIndexingStatusResponseOkSchema = (
  valueLabel: string = "Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(IndexingStatusResponseCodes.Ok),
    realtimeProjection: makeRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link IndexingStatusResponseError}
 **/
export const makeIndexingStatusResponseErrorSchema = (
  _valueLabel: string = "Indexing Status Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(IndexingStatusResponseCodes.Error),
  });

/**
 * Schema for {@link IndexingStatusResponse}
 **/
export const makeIndexingStatusResponseSchema = (valueLabel: string = "Indexing Status Response") =>
  z.discriminatedUnion("responseCode", [
    makeIndexingStatusResponseOkSchema(valueLabel),
    makeIndexingStatusResponseErrorSchema(valueLabel),
  ]);
