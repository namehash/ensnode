import type { SerializedRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import type { SerializedEnsApiPublicConfig } from "../../config/serialized-types";
import type {
  EnsApiIndexingStatusResponse,
  EnsApiIndexingStatusResponseError,
  EnsApiIndexingStatusResponseOk,
} from "./response";

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponseError}.
 */
export type SerializedEnsApiIndexingStatusResponseError = EnsApiIndexingStatusResponseError;

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponseError}.
 *
 * @deprecated Use {@link SerializedEnsApiIndexingStatusResponseError} instead.
 */
export type SerializedIndexingStatusResponseError = SerializedEnsApiIndexingStatusResponseError;

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponseOk}.
 */
export interface SerializedEnsApiIndexingStatusResponseOk
  extends Omit<EnsApiIndexingStatusResponseOk, "realtimeProjection" | "config"> {
  realtimeProjection: SerializedRealtimeIndexingStatusProjection;
  config: SerializedEnsApiPublicConfig;
}

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponseOk}.
 *
 * @deprecated Use {@link SerializedEnsApiIndexingStatusResponseOk} instead.
 */
export type SerializedIndexingStatusResponseOk = SerializedEnsApiIndexingStatusResponseOk;

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponse}.
 */
export type SerializedEnsApiIndexingStatusResponse =
  | SerializedEnsApiIndexingStatusResponseOk
  | SerializedEnsApiIndexingStatusResponseError;

/**
 * Serialized representation of {@link EnsApiIndexingStatusResponse}.
 *
 * @deprecated Use {@link SerializedEnsApiIndexingStatusResponse} instead.
 */
export type SerializedIndexingStatusResponse = SerializedEnsApiIndexingStatusResponse;
