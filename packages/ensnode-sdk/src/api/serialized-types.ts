import type { SerializedRealtimeIndexingStatusProjection } from "../ensindexer";
import type {
  RegistrationLifecycleDomain,
  SerializedRegistrarAction,
  SerializedRegistrationLifecycle,
} from "../registrars";
import {
  IndexingStatusResponse,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  RegistrarActionWithDomain,
  RegistrationLifecycleWithDomain,
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
 * Serialized representation of {@link RegistrationLifecycleWithDomain}.
 */
export interface SerializedRegistrationLifecycleWithDomain extends SerializedRegistrationLifecycle {
  domain: RegistrationLifecycleDomain;
}

/**
 * Serialized representation of {@link RegistrarActionWithDomain}.
 */
export interface SerializedRegistrarActionWithDomain extends SerializedRegistrarAction {
  registrationLifecycle: SerializedRegistrationLifecycleWithDomain;
}

/**
 * Serialized representation of {@link RegistrarActionsResponseOk}.
 */
export interface SerializedRegistrarActionsResponseOk
  extends Omit<RegistrarActionsResponseOk, "registrarActions"> {
  registrarActions: SerializedRegistrarActionWithDomain[];
}

/**
 * Serialized representation of {@link SerializedRegistrarActionsResponse}.
 */
export type SerializedRegistrarActionsResponse =
  | SerializedRegistrarActionsResponseOk
  | SerializedRegistrarActionsResponseError;
