import type { ChainIndexingStatusSnapshot } from "@ensnode/ensnode-sdk";

export function validateChainIndexingStatusSnapshot(
  unvalidatedSnapshot: ChainIndexingStatusSnapshot,
): ChainIndexingStatusSnapshot {
  return unvalidatedSnapshot;
}
