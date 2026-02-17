import type { SerializedRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import type { IndexingStatusResponseError, IndexingStatusResponseOk } from "./response";

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
