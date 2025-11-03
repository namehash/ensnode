import type { SerializedRealtimeIndexingStatusProjection } from "../ensindexer";
import type { SerializedRegistrarActionWithRegistration } from "../registrar-actions";
import {
  IndexingStatusResponse,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
} from "./types";

/**
 * Serialized representation of {@link IndexingStatusResponseError}.
 */
export type SerializedIndexingStatusResponseError = IndexingStatusResponseError;

/**
 * Serialized representation of {@link IndexingStatusResponseOk}.
 */
export interface SerializedIndexingStatusResponseOk
  extends Omit<IndexingStatusResponseOk, "realtimeProjection"> {
  realtimeProjection: SerializedRealtimeIndexingStatusProjection;
}

/**
 * Serialized representation of {@link IndexingStatusResponse}.
 */
export type SerializedIndexingStatusResponse =
  | SerializedIndexingStatusResponseOk
  | SerializedIndexingStatusResponseError;

/**
 * Serialized representation of {@link RegistrarActionsResponseError}.
 */
export type SerializedRegistrarActionsResponseError = RegistrarActionsResponseError;

/**
 * Serialized representation of {@link RegistrarActionsResponseOk}.
 */
export interface SerializedRegistrarActionsResponseOk
  extends Omit<RegistrarActionsResponseOk, "registrarActions"> {
  registrarActions: SerializedRegistrarActionWithRegistration[];
}

/**
 * Serialized representation of {@link SerializedRegistrarActionsResponse}.
 */
export type SerializedRegistrarActionsResponse =
  | SerializedRegistrarActionsResponseOk
  | SerializedRegistrarActionsResponseError;
