/**
 * Ponder SDK: Status
 *
 * This file describes ideas and functionality related to Ponder status for
 * each indexed chain. Ponder status is defined by `/status` endpoint.
 */

import type { BlockRef, ChainId } from "@ensnode/ensnode-sdk";

/*
 * Ponder Status type
 *
 * It's a type of value returned by the `GET /status` endpoint on ponder server.
 *
 * Akin to:
 * https://github.com/ponder-sh/ponder/blob/8c012a3/packages/client/src/index.ts#L13-L18
 */
export interface PonderStatus {
  [chainName: string]: {
    /** Chain ID */
    id: ChainId;

    /** Latest Indexed Block Ref */
    block: BlockRef;
  };
}

/**
 * Fetch Status for requested Ponder instance.
 */
export async function fetchPonderStatus(ponderAppUrl: URL): Promise<PonderStatus> {
  const ponderStatusUrl = new URL("/status", ponderAppUrl);

  try {
    const statusJson = await fetch(ponderStatusUrl).then((r) => r.json());

    return statusJson as PonderStatus;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder status from '${ponderStatusUrl}' due to: ${errorMessage}`,
    );
  }
}
