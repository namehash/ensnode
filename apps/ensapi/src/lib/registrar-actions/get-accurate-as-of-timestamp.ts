import config from "@/config";

import {
  type CrossChainIndexingStatusSnapshot,
  getEthnamesSubregistryId,
  getLatestIndexedBlockRef,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

/**
 * Gets the `accurateAsOf` timestamp for registrar actions data.
 *
 * This timestamp represents when the registrar actions data was accurate as of,
 * based on the latest indexed block for the root chain (where the ENS BaseRegistrar contract lives).
 *
 * @param snapshot - The cross-chain indexing status snapshot
 * @returns The Unix timestamp of when the data was accurate as of
 * @throws Error if the latest indexed block ref for the root chain is null
 */
export function getAccurateAsOfTimestamp(
  snapshot: CrossChainIndexingStatusSnapshot,
): UnixTimestamp {
  const rootChainId = getEthnamesSubregistryId(config.namespace).chainId;
  const latestIndexedBlockRef = getLatestIndexedBlockRef(snapshot, rootChainId);

  if (latestIndexedBlockRef === null) {
    throw new Error(
      `Unable to get accurateAsOf timestamp. Latest indexed block ref for root chain ${rootChainId} is null.`,
    );
  }

  return latestIndexedBlockRef.timestamp;
}
