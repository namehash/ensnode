import {
  deserializeErrorResponse,
  deserializeIndexingStatusResponse,
  type SerializedIndexingStatusResponse,
} from "./api";
import type {
  ConfigResponse,
  ErrorResponse,
  IndexingStatusResponse,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesRequest,
  ResolvePrimaryNamesResponse,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
} from "./api/types";
import { ClientError } from "./client-error";
import {
  deserializePaginatedAggregatedReferrersResponse,
  type PaginatedAggregatedReferrersRequest,
  type PaginatedAggregatedReferrersResponse,
  type SerializedPaginatedAggregatedReferrersResponse,
} from "./ensanalytics";
import { deserializeENSApiPublicConfig, type SerializedENSApiPublicConfig } from "./ensapi";
import type { ResolverRecordsSelection } from "./resolution";

/**
 * Default ENSNode API endpoint URL
 */
export const DEFAULT_ENSNODE_API_URL = "https://api.alpha.ensnode.io" as const;

/**
 * Configuration options for ENSNode API client
 */
export interface ClientOptions {
  /** The ENSNode API URL */
  url: URL;
}

/**
 * ENSNode API Client
 *
 * Provides access to the following ENSNode APIs:
 * - Resolution API
 * - ENSAnalytics API
 * - 🚧 Configuration API
 * - 🚧 Indexing Status API
 *
 * @example
 * ```typescript
 * // Create client with default options
 * const client = new ENSNodeClient();
 *
 * // Use resolution methods
 * const { records } = await client.resolveRecords("jesse.base.eth", {
 *   addresses: [60],
 *   texts: ["avatar"]
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration
 * const client = new ENSNodeClient({
 *   url: new URL("https://my-ensnode-instance.com"),
 * });
 * ```
 */
export class ENSNodeClient {
  private readonly options: ClientOptions;

  static defaultOptions(): ClientOptions {
    return {
      url: new URL(DEFAULT_ENSNODE_API_URL),
    };
  }

  constructor(options: Partial<ClientOptions> = {}) {
    this.options = {
      ...ENSNodeClient.defaultOptions(),
      ...options,
    };
  }

  getOptions(): Readonly<ClientOptions> {
    return Object.freeze({
      url: new URL(this.options.url.href),
    });
  }

  /**
   * Resolves records for an ENS name (Forward Resolution).
   *
   * The returned `name` field, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the name record returned by the resolver is not normalized, `null` is returned as if no name record was set.
   *
   * @param name The ENS Name whose records to resolve
   * @param selection selection of Resolver records
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default false)
   * @param options.trace whether to include a trace in the response (default false)
   * @returns ResolveRecordsResponse<SELECTION>
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * const { records } = await client.resolveRecords("jesse.base.eth", {
   *   addresses: [60],
   *   texts: ["avatar", "com.twitter"]
   * });
   *
   * console.log(records);
   * // {
   * //   addresses: {
   * //     60: "0xabcd..."
   * //   },
   * //   texts: {
   * //     avatar: "https://example.com/image.jpg",
   * //     "com.twitter": null, // if not set, for example
   * //   }
   * // }
   * ```
   */
  async resolveRecords<SELECTION extends ResolverRecordsSelection>(
    name: ResolveRecordsRequest<SELECTION>["name"],
    selection: ResolveRecordsRequest<SELECTION>["selection"],
    options?: Omit<ResolveRecordsRequest<SELECTION>, "name" | "selection">,
  ): Promise<ResolveRecordsResponse<SELECTION>> {
    const url = new URL(`/api/resolve/records/${encodeURIComponent(name)}`, this.options.url);

    // Add query parameters based on selection
    if (selection.name) {
      url.searchParams.set("name", "true");
    }

    if (selection.addresses && selection.addresses.length > 0) {
      url.searchParams.set("addresses", selection.addresses.join(","));
    }

    if (selection.texts && selection.texts.length > 0) {
      url.searchParams.set("texts", selection.texts.join(","));
    }

    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolveRecordsResponse<SELECTION>;
  }

  /**
   * Resolves the primary name of a specified address (Reverse Resolution) on a specific chain.
   *
   * If the chainId-specific Primary Name is not defined, but the `address` specifies a valid
   * [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default
   * Name will be returned. You _may_ query the Default EVM Chain Id (`0`) in order to determine the
   * `address`'s Default Name directly.
   *
   * The returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the primary name set for the address is not normalized, `null` is returned as if no primary name was set.
   *
   * @param address The Address whose Primary Name to resolve
   * @param chainId The chain id within which to query the address' ENSIP-19 Multichain Primary Name
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default false)
   * @param options.trace whether to include a trace in the response (default false)
   * @returns ResolvePrimaryNameResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Name on Ethereum Mainnet
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 1);
   * // name === 'gregskril.eth'
   *
   * // Resolve the address' Primary Name on Base
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 8453);
   * // name === 'greg.base.eth'
   *
   * // Resolve the address' Default Primary Name
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 0);
   * // name === 'gregskril.eth'
   * ```
   */
  async resolvePrimaryName(
    address: ResolvePrimaryNameRequest["address"],
    chainId: ResolvePrimaryNameRequest["chainId"],
    options?: Omit<ResolvePrimaryNameRequest, "address" | "chainId">,
  ): Promise<ResolvePrimaryNameResponse> {
    const url = new URL(`/api/resolve/primary-name/${address}/${chainId}`, this.options.url);

    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolvePrimaryNameResponse;
  }

  /**
   * Resolves the primary names of a specified address across multiple chains.
   *
   * For each Primary Name, if the chainId-specific Primary Name is not defined, but the `address`
   * specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name),
   * the Default Name will be returned. You _may not_ query the Default EVM Chain Id (`0`) directly,
   * and should rely on the aforementioned per-chain defaulting behavior.
   *
   * Each returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the primary name set for the address on any chain is not normalized, `null` is returned for
   * that chain as if no primary name was set.
   *
   * @param address The Address whose Primary Names to resolve
   * @param options additional options
   * @param options.chainIds The set of chain ids within which to query the address' ENSIP-19
   *  Multichain Primary Name (default: all ENSIP-19 supported chains)
   * @param options.accelerate whether to attempt Protocol Acceleration (default: true)
   * @param options.trace whether to include a trace in the response (default: false)
   * @returns ResolvePrimaryNamesResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Names on all ENSIP-19 supported chain ids
   * const { names } = await client.resolvePrimaryNames("0x179A862703a4adfb29896552DF9e307980D19285");
   *
   * console.log(names);
   * // {
   * //   "1": "gregskril.eth", // Default Primary Name
   * //   "10": "gregskril.eth", // Default Primary Name
   * //   "8453": "greg.base.eth", // Base-specific Primary Name!
   * //   "42161": "gregskril.eth", // Default Primary Name
   * //   "59144": "gregskril.eth", // Default Primary Name
   * //   "534352": "gregskril.eth" // Default Primary Name
   * // }
   *
   * // Resolve the address' Primary Names on specific chain Ids
   * const { names } = await client.resolvePrimaryNames("0xabcd...", [1, 8453]);
   *
   * console.log(names);
   * // {
   * //   "1": "gregskril.eth",
   * //   "8453": "greg.base.eth", // base-specific Primary Name!
   * // }
   * ```
   */
  async resolvePrimaryNames(
    address: ResolvePrimaryNamesRequest["address"],
    options?: Omit<ResolvePrimaryNamesRequest, "address">,
  ): Promise<ResolvePrimaryNamesResponse> {
    const url = new URL(`/api/resolve/primary-names/${address}`, this.options.url);

    if (options?.chainIds) url.searchParams.set("chainIds", options.chainIds.join(","));
    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolvePrimaryNamesResponse;
  }

  /**
   * Fetch ENSNode Config
   *
   * Fetch the ENSNode's configuration.
   *
   * @returns {ConfigResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   */
  async config(): Promise<ConfigResponse> {
    const url = new URL(`/api/config`, this.options.url);

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    if (!response.ok) {
      const errorResponse = deserializeErrorResponse(responseData);
      throw new Error(`Fetching ENSNode Config Failed: ${errorResponse.message}`);
    }

    return deserializeENSApiPublicConfig(responseData as SerializedENSApiPublicConfig);
  }

  /**
   * Fetch ENSNode Indexing Status
   *
   * @returns {IndexingStatusResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   */
  async indexingStatus(): Promise<IndexingStatusResponse> {
    const url = new URL(`/api/indexing-status`, this.options.url);

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
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
        // if errorResponse is could not be determined,
        // it means the response includes indexing status data
        console.log("Indexing Status API: handling a known indexing status server error.");
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSNode Indexing Status Failed: ${errorResponse.message}`);
      }
    }

    return deserializeIndexingStatusResponse(responseData as SerializedIndexingStatusResponse);
  }

  /**
   * Fetch Paginated Aggregated Referrers
   *
   * Retrieves a paginated list of aggregated referrer metrics with contribution percentages.
   * Each referrer's contribution is calculated as a percentage of the grand totals across all referrers.
   *
   * @param request - Pagination parameters
   * @param request.page - The page number to retrieve (1-indexed, default: 1)
   * @param request.itemsPerPage - Number of items per page (default: 25, max: 100)
   * @returns {PaginatedAggregatedReferrersResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   *
   * @example
   * ```typescript
   * // Get first page with default page size (25 items)
   * const response = await client.getAggregatedReferrers();
   * if (response.responseCode === 'ok') {
   *   console.log(response.data.referrers);
   *   console.log(`Page ${response.data.paginationParams.page} of ${Math.ceil(response.data.total / response.data.paginationParams.itemsPerPage)}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second page with 50 items per page
   * const response = await client.getAggregatedReferrers({ page: 2, itemsPerPage: 50 });
   * ```
   */
  async getAggregatedReferrers(
    request?: PaginatedAggregatedReferrersRequest,
  ): Promise<PaginatedAggregatedReferrersResponse> {
    const url = new URL(`/api/ensanalytics/aggregated-referrers`, this.options.url);

    if (request?.page) url.searchParams.set("page", request.page.toString());
    if (request?.itemsPerPage)
      url.searchParams.set("itemsPerPage", request.itemsPerPage.toString());

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // The API can return errors with 500 status, but they're still in the
    // PaginatedAggregatedReferrersResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializePaginatedAggregatedReferrersResponse(
      responseData as SerializedPaginatedAggregatedReferrersResponse,
    );
  }
}
