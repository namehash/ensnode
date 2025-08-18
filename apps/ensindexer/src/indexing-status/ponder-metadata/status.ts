/**
 * Ponder Metadata: Status
 *
 * This file describes ideas and functionality related to Ponder status for
 * each indexed chain. Ponder status is defined by `/status` endpoint.
 */

import type { PonderStatus } from "@ensnode/ponder-metadata";

export type { PonderStatus } from "@ensnode/ponder-metadata";

/**
 * Fetch Status for requested Ponder instance.
 */
export async function fetchPonderStatus(ponderAppUrl: URL): Promise<PonderStatus> {
  const ponderStatusUrl = new URL("/status", ponderAppUrl);

  try {
    const statusJson = await fetch(ponderStatusUrl).then((r) => r.json());

    return statusJson;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder status from '${ponderStatusUrl}' due to: ${errorMessage}`,
    );
  }
}
