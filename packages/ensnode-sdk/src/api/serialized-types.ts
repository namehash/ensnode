import type { SerializedRealtimeIndexingStatusProjection } from "../ensindexer";
import {
  IndexingStatusResponse,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
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
