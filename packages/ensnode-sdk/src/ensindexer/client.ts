import type { Unvalidated } from "../shared/types";
import {
  type ConfigResponse,
  deserializeConfigResponse,
  deserializeIndexingStatusResponse,
  type IndexingStatusResponse,
  type SerializedConfigResponse,
  type SerializedIndexingStatusResponse,
} from "./api";
import type { ErrorResponse } from "./api/shared/errors";
import { deserializeErrorResponse } from "./api/shared/errors/deserialize";

/**
 * Configuration options for ENSIndexer API client
 */
export interface ClientOptions {
  /** The ENSIndexer API URL */
  url: URL;
}

/**
 * ENSIndexer API Client
 *
 * Provides access to the following ENSIndexer APIs:
 * - Configuration API
 * - Indexing Status API
 *
 * @example
 * ```typescript
 * import { ENSIndexerClient } from "@ensnode/ensnode-sdk";
 *
 * // Custom configuration
 * const client = new ENSIndexerClient({
 *   url: new URL("https://my-ENSIndexer-instance.com"),
 * });
 * ```
 */
export class ENSIndexerClient {
  constructor(private readonly options: ClientOptions) {}

  getOptions(): Readonly<ClientOptions> {
    return Object.freeze(this.options);
  }

  /**
   * Fetch ENSIndexer Config
   *
   * Fetch the ENSIndexer's configuration.
   *
   * @returns {ConfigResponse}
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer API returns an error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  async config(): Promise<ConfigResponse> {
    const url = new URL(`/api/config`, this.options.url);

    const response = await fetch(url);

    // ENSIndexer API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    if (!response.ok) {
      const errorResponse = deserializeErrorResponse(responseData);
      throw new Error(`Fetching ENSIndexer Config Failed: ${errorResponse.message}`);
    }

    return deserializeConfigResponse(responseData as Unvalidated<SerializedConfigResponse>);
  }

  /**
   * Fetch ENSIndexer Indexing Status
   *
   * @returns {IndexingStatusResponse}
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer API returns an error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  async indexingStatus(): Promise<IndexingStatusResponse> {
    const url = new URL(`/api/indexing-status`, this.options.url);

    const response = await fetch(url);

    // ENSIndexer API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // handle response errors accordingly
    if (!response.ok) {
      // check for a generic errorResponse
      let errorResponse: ErrorResponse | undefined;
      try {
        errorResponse = deserializeErrorResponse(responseData);
      } catch {
        // if errorResponse could not be determined,
        // it means the response includes indexing status data
        console.log("Indexing Status API: handling a known indexing status server error.");
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSIndexer Indexing Status Failed: ${errorResponse.message}`);
      }
    }

    return deserializeIndexingStatusResponse(responseData as SerializedIndexingStatusResponse);
  }
}
