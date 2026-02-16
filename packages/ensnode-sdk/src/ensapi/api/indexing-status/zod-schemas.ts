import { z } from "zod/v4";

import {
  makeRealtimeIndexingStatusProjectionSchema,
  makeSerializedRealtimeIndexingStatusProjectionSchema,
} from "../../../indexing-status/zod-schema/realtime-indexing-status-projection";
import {
  type EnsApiIndexingStatusResponse,
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
} from "./response";
import {
  SerializedEnsApiIndexingStatusResponse,
  SerializedEnsApiIndexingStatusResponseOk,
} from "./serialized-response";

/**
 * Schema for {@link EnsApiIndexingStatusResponseOk}
 **/
export const makeEnsApiIndexingStatusResponseOkSchema = (
  valueLabel: string = "Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(EnsApiIndexingStatusResponseCodes.Ok),
    realtimeProjection: makeRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link EnsApiIndexingStatusResponseError}
 **/
export const makeEnsApiIndexingStatusResponseErrorSchema = (
  _valueLabel: string = "Indexing Status Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(EnsApiIndexingStatusResponseCodes.Error),
  });

/**
 * Schema for {@link EnsApiIndexingStatusResponse}
 **/
export const makeEnsApiIndexingStatusResponseSchema = (
  valueLabel: string = "Indexing Status Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeEnsApiIndexingStatusResponseOkSchema(valueLabel),
    makeEnsApiIndexingStatusResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for {@link EnsApiIndexingStatusResponse}
 * @deprecated Use {@link makeEnsApiIndexingStatusResponseSchema} instead.
 */
export const makeIndexingStatusResponseSchema = makeEnsApiIndexingStatusResponseSchema;

/**
 * Schema for {@link SerializedEnsApiIndexingStatusResponseOk}
 **/
export const makeSerializedEnsApiIndexingStatusResponseOkSchema = (
  valueLabel: string = "Serialized Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(EnsApiIndexingStatusResponseCodes.Ok),
    realtimeProjection: makeSerializedRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link SerializedEnsApiIndexingStatusResponse}
 **/
export const makeSerializedEnsApiIndexingStatusResponseSchema = (
  valueLabel: string = "Serialized Indexing Status Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeSerializedEnsApiIndexingStatusResponseOkSchema(valueLabel),
    makeEnsApiIndexingStatusResponseErrorSchema(valueLabel),
  ]);
