import type { SerializedRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import type {
  EnsIndexerIndexingStatusResponseError,
  EnsIndexerIndexingStatusResponseOk,
} from "./response";

/**
 * Serialized representation of {@link EnsIndexerIndexingStatusResponseError}.
 */
export type SerializedEnsIndexerIndexingStatusResponseError = EnsIndexerIndexingStatusResponseError;

/**
 * Serialized representation of {@link EnsIndexerIndexingStatusResponseOk}.
 */
export interface SerializedEnsIndexerIndexingStatusResponseOk
  extends Omit<EnsIndexerIndexingStatusResponseOk, "realtimeProjection"> {
  realtimeProjection: SerializedRealtimeIndexingStatusProjection;
}

/**
 * Serialized representation of {@link EnsIndexerIndexingStatusResponse}.
 */
export type SerializedEnsIndexerIndexingStatusResponse =
  | SerializedEnsIndexerIndexingStatusResponseOk
  | SerializedEnsIndexerIndexingStatusResponseError;
