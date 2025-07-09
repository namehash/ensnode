import { fetchPonderStatus } from "@/lib/ponder-metadata-provider";
import { PonderStatus } from "@ensnode/ponder-metadata";

/**
 * Get the current Ponder Status.
 *
 * @returns Promise<PonderStatus>
 */
export async function getPonderStatus(): Promise<PonderStatus> {
  return fetchPonderStatus();
}

/**
 * Get the current date.
 */
export function getCurrentDate() {
  return new Date();
}
