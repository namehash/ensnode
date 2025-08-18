import { deserializeErrorResponse } from "./api";
import {
  type ConfigResponse,
  type ErrorResponse,
  type IndexingStatusRequest,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type ResolvePrimaryNameRequest,
  type ResolvePrimaryNameResponse,
  type ResolvePrimaryNamesRequest,
  type ResolvePrimaryNamesResponse,
  type ResolveRecordsRequest,
  type ResolveRecordsResponse,
} from "./api/types";
import {
  type SerializedENSIndexerOverallIndexingStatus,
  type SerializedENSIndexerPublicConfig,
  deserializeENSIndexerIndexingStatus,
  deserializeENSIndexerPublicConfig,
} from "./ensindexer";
import { ResolverRecordsSelection } from "./resolution";

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
   * @param name The ENS Name whose records to resolve
   * @param selection selection of Resolver records
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default true)
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
    if (options?.accelerate === false) url.searchParams.set("accelerate", "false");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Records Resolution Failed: ${error.message}`);
    }

    const data = await response.json();
    return data as ResolveRecordsResponse<SELECTION>;
  }

  /**
   * Resolves the primary name of a specified address (Reverse Resolution) on a specific chain.
   *
   * If the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name),
   * the Default Name will be returned. You _may_ query the Default EVM Chain Id (`0`) in order to
   * determine the `address`'s Default Name directly.
   *
   * @param address The Address whose Primary Name to resolve
   * @param chainId The chain id within which to query the address' ENSIP-19 Multichain Primary Name
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default true)
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
    if (options?.accelerate === false) url.searchParams.set("accelerate", "false");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Primary Name Resolution Failed: ${error.message}`);
    }

    const data = await response.json();
    return data as ResolvePrimaryNameResponse;
  }

  /**
   * Resolves the primary names of a specified address across multiple chains.
   *
   * If the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name),
   * the Default Name will be returned for all chainIds for which there is not a chain-specific
   * Primary Name. To avoid misuse, you _may not_ query the Default EVM Chain Id (`0`) directly, and
   * should rely on the aforementioned per-chain defaulting behavior.
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
   * //   "1": "gregskril.eth",
   * //   "10": "gregskril.eth",
   * //   "8453": "greg.base.eth", // base-specific Primary Name!
   * //   "42161": "gregskril.eth",
   * //   "59144": "gregskril.eth",
   * //   "534352": "gregskril.eth"
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
    if (options?.accelerate === false) url.searchParams.set("accelerate", "false");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Primary Names Resolution Failed: ${error.message}`);
    }

    const data = await response.json();
    return data as ResolvePrimaryNamesResponse;
  }

  /**
   * Fetch ENSNode Config
   *
   * The Config API provides a complete view of an ENSNode instance’s public
   * configuration, making it easy to understand and verify it’s configuration.
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

    let responseData: ConfigResponse | ErrorResponse;

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    if (!response.ok) {
      const ErrorResponse = deserializeErrorResponse(responseData);
      throw new Error(`Fetching ENSNode Config Failed: ${ErrorResponse.message}`);
    }

    const data = (await response.json()) as SerializedENSIndexerPublicConfig;

    return deserializeENSIndexerPublicConfig(data);
  }

  /**
   * Fetch ENSNode Indexing Status
   *
   * Monitor an ENSNode’s indexing progress across multiple chains with
   * the Indexing Status API. This endpoint provides detailed information about
   * which chains are being indexed, each chain’s indexing status,
   * and the overall multichain indexing status.
   *
   * @returns {IndexingStatusResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   */
  async indexingStatus(options?: IndexingStatusRequest): Promise<IndexingStatusResponse> {
    const url = new URL(`/api/indexing-status`, this.options.url);

    if (typeof options?.maxRealtimeDistance !== "undefined") {
      url.searchParams.set("maxRealtimeDistance", `${options.maxRealtimeDistance}`);
    }

    const response = await fetch(url);

    let responseData: IndexingStatusResponse | ErrorResponse;

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // handle application errors accordingly
    if (!response.ok) {
      switch (response.status) {
        case IndexingStatusResponseCodes.IndexerError: {
          console.error("Indexing Status API: indexer error");
          return deserializeENSIndexerIndexingStatus(
            responseData as SerializedENSIndexerOverallIndexingStatus,
          );
        }

        case IndexingStatusResponseCodes.RequestedDistanceNotAchievedError: {
          console.error(
            "Indexing Status API: Requested realtime indexing distance not achieved error",
          );
          return deserializeENSIndexerIndexingStatus(
            responseData as SerializedENSIndexerOverallIndexingStatus,
          );
        }

        default: {
          const ErrorResponse = deserializeErrorResponse(responseData);
          throw new Error(`Fetching ENSNode Indexing Status Failed: ${ErrorResponse.message}`);
        }
      }
    }

    return deserializeENSIndexerIndexingStatus(
      responseData as SerializedENSIndexerOverallIndexingStatus,
    );
  }
}
