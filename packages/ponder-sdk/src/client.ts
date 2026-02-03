import {
  deserializePonderIndexingStatus,
  type PonderIndexingStatus,
} from "./deserialize/indexing-status";

/**
 * PonderClient for interacting with Ponder app endpoints.
 */
export class PonderClient {
  constructor(private baseUrl: URL) {}

  /**
   * Get Ponder Indexing Status
   *
   * @returns Ponder Indexing Status.
   * @throws Error if the response could not be fetched or was invalid.
   */
  async status(): Promise<PonderIndexingStatus> {
    const requestUrl = new URL("/status", this.baseUrl);
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Ponder Indexing Status: ${response.status} ${response.statusText}`,
      );
    }

    const responseData = await response.json();

    return deserializePonderIndexingStatus(responseData);
  }
}
