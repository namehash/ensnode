import {
  type ChainIndexingConfigTypeId,
  ChainIndexingConfigTypeIds,
  type OmnichainIndexingStatusId,
  type OmnichainIndexingStatusIdFinal,
  OmnichainIndexingStatusIds,
  type RealtimeIndexingStatusProjection,
} from "../../ensindexer/indexing-status";
import {
  type AbstractResultOk,
  ResultCodes,
  type ResultInsufficientIndexingProgress,
  type ResultInternalServerError,
  type ResultServiceUnavailable,
} from "../../shared/result";

/**
 * Data included with a successful Indexing Status for supported API result.
 */
export interface ResultOkIndexingStatusForSupportedApiData {
  indexingStatus: RealtimeIndexingStatusProjection;
}

/**
 * Successful result for Indexing Status for supported API calls.
 */
export type ResultOkIndexingStatusForSupportedApi =
  AbstractResultOk<ResultOkIndexingStatusForSupportedApiData>;

export function buildResultOkIndexingStatusForSupportedApi(
  data: ResultOkIndexingStatusForSupportedApiData,
): ResultOkIndexingStatusForSupportedApi {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

/**
 * The operation result for Indexing Status for supported API calls.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type IndexingStatusForSupportedApiResult =
  | ResultOkIndexingStatusForSupportedApi
  | ResultInternalServerError
  | ResultServiceUnavailable
  | ResultInsufficientIndexingProgress;

/**
 * Get the required Omnichain Indexing Status ID
 * to support the API handler for a given Chain Indexing Config Type.
 */
export function getSupportedIndexingStatusForApiHandler(
  configType: ChainIndexingConfigTypeId,
): OmnichainIndexingStatusIdFinal {
  switch (configType) {
    case ChainIndexingConfigTypeIds.Definite:
      return OmnichainIndexingStatusIds.Completed;
    case ChainIndexingConfigTypeIds.Indefinite:
      return OmnichainIndexingStatusIds.Following;
  }
}

/**
 * Check if the given Omnichain Indexing Status ID
 * supports the API handler for a given Chain Indexing Config Type.
 */
export function isApiHandlerSupportedByIndexingStatus(
  configType: ChainIndexingConfigTypeId,
  omnichainIndexingStatusId: OmnichainIndexingStatusId,
): boolean {
  return getSupportedIndexingStatusForApiHandler(configType) === omnichainIndexingStatusId;
}
