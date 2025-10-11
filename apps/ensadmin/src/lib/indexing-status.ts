import type { ChainIndexingStatusId, OmnichainIndexingStatusId } from "@ensnode/ensnode-sdk";

export function formatChainStatus(status: ChainIndexingStatusId): string {
  const [, formattedStatus] = status.split("-");

  return formattedStatus;
}

export function formatOmnichainStatus(status: OmnichainIndexingStatusId): string {
  const [, formattedStatus] = status.split("-");

  return formattedStatus;
}
