import { Address } from "viem";
import type { CoinType, Name } from "./utils";

/**
 * Default ENSNode resolution API endpoint URL
 */
export const DEFAULT_RESOLUTION_API_URL = "https://api.mainnet.ensnode.io" as const;

export namespace Resolution {
  /**
   * Selection criteria for what records to resolve
   */
  export interface RecordsSelection {
    /** Whether to include the canonical name */
    name?: boolean;
    /** Array of coin types to resolve addresses for */
    addresses?: CoinType[];
    /** Array of text record keys to resolve */
    texts?: string[];
  }

  /**
   * Resolved records response
   */
  export interface Records {
    /** The canonical name if requested */
    name?: string;
    /** Resolved addresses by coin type */
    addresses?: Record<string, string>;
    /** Resolved text records */
    texts?: Record<string, string>;
  }

  /**
   * Base API response structure
   */
  export interface BaseResponse {
    /** Resolved records */
    records: Records;
    /** Debug trace information (if debug enabled) */
    trace?: any;
  }

  /**
   * Forward resolution response (name to records)
   */
  export interface ForwardResponse extends BaseResponse {}

  /**
   * Reverse resolution response (address to name)
   */
  export interface ReverseResponse extends BaseResponse {}

  /**
   * API error response
   */
  export interface ErrorResponse {
    error: string;
  }

  /**
   * Resolution API client options
   */
  export interface ClientOptions {
    /** The resolution API endpoint URL */
    endpointUrl: URL;
    /** Whether to enable debug tracing */
    debug?: boolean;
  }

  /**
   * Resolution API client interface
   */
  export interface Client {
    /**
     * Resolve an ENS name to records (forward resolution)
     */
    resolveName(name: Name, selection?: RecordsSelection): Promise<ForwardResponse>;

    /**
     * Resolve an address to its primary name (reverse resolution)
     */
    resolveAddress(address: Address, chainId?: number): Promise<ReverseResponse>;

    /**
     * Get the current client options
     */
    getOptions(): Readonly<ClientOptions>;
  }
}

/**
 * ENSNode Resolution API client
 *
 * Provides simple methods for ENS name and address resolution.
 *
 * @example
 * ```typescript
 * // Create client with default options
 * const client = new ResolutionApiClient();
 *
 * // Resolve a name to address records
 * const nameResult = await client.resolveName("vitalik.eth", {
 *   addresses: [60],
 *   texts: ["avatar", "com.twitter"]
 * });
 *
 * // Resolve an address to its primary name
 * const addressResult = await client.resolveAddress("0xd...");
 * ```
 */
export class ResolutionApiClient implements Resolution.Client {
  private readonly options: Resolution.ClientOptions;

  /**
   * Create default client options
   */
  static defaultOptions(): Resolution.ClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_RESOLUTION_API_URL),
      debug: false,
    };
  }

  constructor(options: Partial<Resolution.ClientOptions> = {}) {
    this.options = {
      ...ResolutionApiClient.defaultOptions(),
      ...options,
    };
  }

  /**
   * Resolve an ENS name to records (forward resolution)
   *
   * @param name The ENS name to resolve
   * @param selection Optional selection of what records to resolve
   * @returns Promise resolving to the records
   * @throws If the request fails or the name is not found
   *
   * @example
   * ```typescript
   * const result = await client.resolveName("vitalik.eth", {
   *   name: true,
   *   addresses: [60, 0],
   *   texts: ["avatar", "com.twitter"]
   * });
   * ```
   */
  async resolveName(
    name: Name,
    selection: Resolution.RecordsSelection = {},
  ): Promise<Resolution.ForwardResponse> {
    const url = new URL(`/forward/${encodeURIComponent(name)}`, this.options.endpointUrl);

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

    if (this.options.debug) {
      url.searchParams.set("debug", "true");
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as Resolution.ErrorResponse;
      throw new Error(`Forward resolution failed: ${error.error}`);
    }

    return response.json() as Promise<Resolution.ForwardResponse>;
  }

  /**
   * Resolve an address to its primary name (reverse resolution)
   *
   * @param address The address to resolve
   * @param chainId Optional chain ID for multichain resolution (defaults to 1 for Ethereum mainnet)
   * @returns Promise resolving to the primary name
   * @throws If the request fails or no primary name is set
   *
   * @example
   * ```typescript
   * // Resolve on Ethereum mainnet
   * const result = await client.resolveAddress("0xd...");
   *
   * // Resolve on Optimism
   * const result = await client.resolveAddress("0xd...", 10);
   * ```
   */
  async resolveAddress(address: Address, chainId: number = 1): Promise<Resolution.ReverseResponse> {
    const url = new URL(`/reverse/${address}`, this.options.endpointUrl);

    if (chainId !== 1) {
      url.searchParams.set("chainId", chainId.toString());
    }

    if (this.options.debug) {
      url.searchParams.set("debug", "true");
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as Resolution.ErrorResponse;
      throw new Error(`Reverse resolution failed: ${error.error}`);
    }

    return response.json() as Promise<Resolution.ReverseResponse>;
  }

  /**
   * Get a copy of the current client options
   */
  getOptions(): Readonly<Resolution.ClientOptions> {
    return Object.freeze({
      endpointUrl: new URL(this.options.endpointUrl.href),
      debug: this.options.debug,
    });
  }
}
