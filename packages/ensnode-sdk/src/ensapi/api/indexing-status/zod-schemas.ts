import { z } from "zod/v4";

import {
  makeRealtimeIndexingStatusProjectionSchema,
  makeSerializedRealtimeIndexingStatusProjectionSchema,
} from "../../../indexing-status/zod-schema/realtime-indexing-status-projection";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
} from "./response";
import {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
} from "./serialized-response";

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

/**
 * Schema for {@link SerializedIndexingStatusResponseOk}
 **/
export const makeSerializedIndexingStatusResponseOkSchema = (
  valueLabel: string = "Serialized Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(IndexingStatusResponseCodes.Ok),
    realtimeProjection: makeSerializedRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link SerializedIndexingStatusResponse}
 **/
export const makeSerializedIndexingStatusResponseSchema = (
  valueLabel: string = "Serialized Indexing Status Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeSerializedIndexingStatusResponseOkSchema(valueLabel),
    makeIndexingStatusResponseErrorSchema(valueLabel),
  ]);
