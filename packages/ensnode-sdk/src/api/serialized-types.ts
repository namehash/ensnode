import type { SerializedRealtimeIndexingStatusProjection } from "../ensindexer";
import type { SerializedRegistrarAction } from "../registrars";
import {
  IndexingStatusResponse,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  type NamedRegistrarAction,
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
 * Serialized representation of {@link NamedRegistrarAction}.
 */
export interface SerializedNamedRegistrarAction extends Omit<NamedRegistrarAction, "action"> {
  action: SerializedRegistrarAction;
}

/**
 * Serialized representation of {@link RegistrarActionsResponseOk}.
 */
export interface SerializedRegistrarActionsResponseOk
  extends Omit<RegistrarActionsResponseOk, "registrarActions"> {
  registrarActions: SerializedNamedRegistrarAction[];
}

/**
 * Serialized representation of {@link SerializedRegistrarActionsResponse}.
 */
export type SerializedRegistrarActionsResponse =
  | SerializedRegistrarActionsResponseOk
  | SerializedRegistrarActionsResponseError;
