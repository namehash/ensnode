import type { Unvalidated } from "../shared/types";
import {
  deserializeEnsIndexerConfigResponse,
  deserializeEnsIndexerIndexingStatusResponse,
  type EnsIndexerConfigResponse,
  type EnsIndexerIndexingStatusResponse,
  type SerializedEnsIndexerConfigResponse,
  type SerializedEnsIndexerIndexingStatusResponse,
} from "./api";
import type { ErrorResponse } from "./api/shared/errors";
import { deserializeErrorResponse } from "./api/shared/errors/deserialize";

/**
 * Configuration options for ENSIndexer API client
 */
export interface EnsIndexerClientOptions {
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
 * import { EnsIndexerClient } from "@ensnode/ensnode-sdk";
 *
 * // Custom configuration
 * const client = new EnsIndexerClient({
 *   url: new URL("https://my-ENSIndexer-instance.com"),
 * });
 * ```
 */
export class EnsIndexerClient {
  constructor(private readonly options: EnsIndexerClientOptions) {}

  getOptions(): Readonly<EnsIndexerClientOptions> {
    return Object.freeze({
      url: new URL(this.options.url.href),
    });
  }

  /**
   * Fetch ENSIndexer Config
   *
   * Fetch the ENSIndexer's configuration.
   *
   * @returns {EnsIndexerConfigResponse}
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer returns a generic error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  async config(): Promise<EnsIndexerConfigResponse> {
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

    // handle response errors accordingly
    if (!response.ok) {
      // check for a generic errorResponse
      let errorResponse: ErrorResponse | undefined;
      try {
        errorResponse = deserializeErrorResponse(responseData);
      } catch {
        // No-op: allow subsequent deserialization of config response.
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSIndexer Config Failed: ${errorResponse.message}`);
      }
    }

    return deserializeEnsIndexerConfigResponse(
      responseData as Unvalidated<SerializedEnsIndexerConfigResponse>,
    );
  }

  /**
   * Fetch ENSIndexer Indexing Status
   *
   * @returns {EnsIndexerIndexingStatusResponse}
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer returns a generic error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  async indexingStatus(): Promise<EnsIndexerIndexingStatusResponse> {
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
        // No-op: allow subsequent deserialization of indexing status response.
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSIndexer Indexing Status Failed: ${errorResponse.message}`);
      }
    }

    return deserializeEnsIndexerIndexingStatusResponse(
      responseData as Unvalidated<SerializedEnsIndexerIndexingStatusResponse>,
    );
  }
}
