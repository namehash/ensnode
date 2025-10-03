import z from "zod/v4";
import { makeRealtimeIndexingStatusProjectionSchema } from "../ensindexer/indexing-status/zod-schemas";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
} from "./types";

export const ErrorResponseSchema = z.object({
  message: z.string(),
  details: z.optional(z.unknown()),
});

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
  valueLabel: string = "Indexing Status Response Error",
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
