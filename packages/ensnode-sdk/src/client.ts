import {
  ErrorResponse,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesRequest,
  ResolvePrimaryNamesResponse,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
} from "./api/types";
import {
  ForwardResolutionArgs,
  ResolverRecordsSelection,
  ReverseResolutionArgs,
} from "./resolution";

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
   * @param selection Optional selection of Resolver records
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
    options?: Omit<ResolveRecordsRequest<SELECTION>, keyof ForwardResolutionArgs<SELECTION>>,
  ): Promise<ResolveRecordsResponse<SELECTION>> {
    const url = new URL(`/api/resolve/records/${encodeURIComponent(name)}`, this.options.url);

    // Add query parameters based on selection
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
      throw new Error(`Records Resolution Failed: ${error.error}`);
    }

    const data = await response.json();
    return data as ResolveRecordsResponse<SELECTION>;
  }

  /**
   * Resolves the primary name of a specified address (Reverse Resolution).
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
   * const { name } = await client.resolvePrimaryName("0xabcd...", 1);
   *
   * console.log(name);
   * // 'jesse.base.eth'
   *
   * // Resolve the address' Primary Name on Optimism
   * const { name } = await client.resolvePrimaryName("0xabcd...", 10);
   * ```
   */
  async resolvePrimaryName(
    address: ResolvePrimaryNameRequest["address"],
    chainId: ResolvePrimaryNameRequest["chainId"],
    options?: Omit<ResolvePrimaryNameRequest, keyof ReverseResolutionArgs>,
  ): Promise<ResolvePrimaryNameResponse> {
    const url = new URL(`/api/resolve/primary-name/${address}/${chainId}`, this.options.url);

    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate === false) url.searchParams.set("accelerate", "false");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Primary Name Resolution Failed: ${error.error}`);
    }

    const data = await response.json();
    return data as ResolvePrimaryNameResponse;
  }

  /**
   * Resolves the primary names of a specified address (Batch Reverse Resolution).
   *
   * @param address The Address whose Primary Name to resolve
   * @param options additional options
   * @param options.chainIds The set of chain ids within which to query the address' ENSIP-19
   *  Multichain Primary Name (defaults to all well-known ENSIP-19 chain ids)
   * @param options.accelerate whether to attempt Protocol Acceleration (default true)
   * @param options.trace whether to include a trace in the response (default false)
   * @returns ResolvePrimaryNamesResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Names on all well-known chain ids
   * const { names } = await client.resolvePrimaryNames("0xabcd...");
   *
   * console.log(names);
   * // { 0: 'jesse.base.eth', 1: 'jesse.base.eth', ... }
   *
   * // Resolve the address' Primary Names on specific chain Ids
   * const { names } = await client.resolvePrimaryName("0xabcd...", [1, 10]);
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
      throw new Error(`Primary Names Resolution Failed: ${error.error}`);
    }

    const data = await response.json();
    return data as ResolvePrimaryNamesResponse;
  }
}
