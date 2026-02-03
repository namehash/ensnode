import { buildPonderStatus, type PonderStatus } from "./api/status";
import type { ChainId } from "./chain";
import { validatePonderStatusResponse } from "./ponder-status";

/**
 * PonderClient for interacting with Ponder app endpoints.
 *
 * Requires the set of indexed chain IDs to validate the status response against the expected chains.
 * This ensures that the client can detect if the Ponder instance is missing status for any of the indexed chains.
 */
export class PonderClient {
  constructor(
    private baseUrl: URL,
    private indexedChainIds: Set<ChainId>,
  ) {}

  /**
   * Get Ponder Status
   *
   * @returns Validated Ponder Status response
   * @throws Error if the response is invalid
   */
  async status(): Promise<PonderStatus> {
    const requestUrl = new URL("/status", this.baseUrl);
    const response = await fetch(requestUrl);
    const responseData = await response.json();

    const validatedData = validatePonderStatusResponse(responseData, this.indexedChainIds);

    return buildPonderStatus(validatedData);
  }
}
