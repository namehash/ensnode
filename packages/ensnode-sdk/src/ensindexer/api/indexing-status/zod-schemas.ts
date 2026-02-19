import { z } from "zod/v4";

import {
  makeRealtimeIndexingStatusProjectionSchema,
  makeSerializedRealtimeIndexingStatusProjectionSchema,
} from "../../../indexing-status/zod-schema/realtime-indexing-status-projection";
import {
  type EnsIndexerIndexingStatusResponse,
  EnsIndexerIndexingStatusResponseCodes,
  type EnsIndexerIndexingStatusResponseError,
  type EnsIndexerIndexingStatusResponseOk,
} from "./response";
import type {
  SerializedEnsIndexerIndexingStatusResponse,
  SerializedEnsIndexerIndexingStatusResponseOk,
} from "./serialized-response";

/**
 * Schema for {@link EnsIndexerIndexingStatusResponseOk}
 **/
export const makeEnsIndexerIndexingStatusResponseOkSchema = (
  valueLabel: string = "Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(EnsIndexerIndexingStatusResponseCodes.Ok),
    realtimeProjection: makeRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link EnsIndexerIndexingStatusResponseError}
 **/
export const makeEnsIndexerIndexingStatusResponseErrorSchema = (
  _valueLabel: string = "Indexing Status Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(EnsIndexerIndexingStatusResponseCodes.Error),
  });

/**
 * Schema for {@link EnsIndexerIndexingStatusResponse}
 **/
export const makeEnsIndexerIndexingStatusResponseSchema = (
  valueLabel: string = "Indexing Status Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeEnsIndexerIndexingStatusResponseOkSchema(valueLabel),
    makeEnsIndexerIndexingStatusResponseErrorSchema(valueLabel),
  ]);

/**
 * Schema for {@link SerializedEnsIndexerIndexingStatusResponseOk}
 **/
export const makeSerializedEnsIndexerIndexingStatusResponseOkSchema = (
  valueLabel: string = "Serialized Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(EnsIndexerIndexingStatusResponseCodes.Ok),
    realtimeProjection: makeSerializedRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link SerializedEnsIndexerIndexingStatusResponse}
 **/
export const makeSerializedEnsIndexerIndexingStatusResponseSchema = (
  valueLabel: string = "Serialized Indexing Status Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeSerializedEnsIndexerIndexingStatusResponseOkSchema(valueLabel),
    makeEnsIndexerIndexingStatusResponseErrorSchema(valueLabel),
  ]);
