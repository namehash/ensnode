import type { Address } from "viem";
import type { CoinType, Name } from "./ens";

/**
 * Default ENSNode API endpoint URL
 */
export const DEFAULT_ENSNODE_API_URL = "https://api.alpha.ensnode.io" as const;

/**
 * Configuration options for ENSNode API client
 */
export interface ClientOptions {
  /** The ENSNode API endpoint URL */
  endpointUrl: URL;
  /** Whether to enable debug tracing */
  debug?: boolean;
}

/**
 * Selection criteria for forward resolution (name to records)
 */
export interface ForwardResolutionSelection {
  /** Array of coin types to resolve addresses for */
  addresses?: CoinType[];
  /** Array of text record keys to resolve */
  texts?: string[];
}

/**
 * Resolved records response
 */
export interface Records {
  /** The canonical name (only available in reverse resolution) */
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
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Complete ENSNode API client interface
 */
export interface Client {
  /**
   * Resolve an ENS name to records (forward resolution)
   */
  resolveName(name: Name, selection?: ForwardResolutionSelection): Promise<ForwardResponse>;

  /**
   * Resolve an address to its primary name (reverse resolution)
   */
  resolveAddress(address: Address, chainId?: number): Promise<ReverseResponse>;

  /**
   * Get the current client options
   */
  getOptions(): Readonly<ClientOptions>;
}

/**
 * Complete ENSNode API client
 *
 * Provides access to all ENSNode API functionality through a unified interface.
 * Supports resolution, configuration, and indexing status operations.
 *
 * @example
 * ```typescript
 * // Create client with default options
 * const client = new ENSNodeClient();
 *
 * // Use resolution methods
 * const nameResult = await client.resolveName("vitalik.eth", {
 *   addresses: [60],
 *   texts: ["avatar"]
 * });
 *

 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration
 * const client = new ENSNodeClient({
 *   endpointUrl: new URL("https://custom-api.ensnode.io"),
 *   debug: true
 * });
 * ```
 */
export class ENSNodeClient implements Client {
  private readonly options: ClientOptions;

  /**
   * Create default client options
   */
  static defaultOptions(): ClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSNODE_API_URL),
      debug: false,
    };
  }

  constructor(options: Partial<ClientOptions> = {}) {
    this.options = {
      ...ENSNodeClient.defaultOptions(),
      ...options,
    };
  }

  /**
   * Get a copy of the current client options
   */
  getOptions(): Readonly<ClientOptions> {
    return Object.freeze({
      endpointUrl: new URL(this.options.endpointUrl.href),
      debug: this.options.debug,
    });
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
   *   addresses: [60, 0],
   *   texts: ["avatar", "com.twitter"]
   * });
   * ```
   */
  async resolveName(
    name: Name,
    selection: ForwardResolutionSelection = {},
  ): Promise<ForwardResponse> {
    const url = new URL(`/forward/${encodeURIComponent(name)}`, this.options.endpointUrl);

    // Add query parameters based on selection
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
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Forward resolution failed: ${error.error}`);
    }

    return response.json() as Promise<ForwardResponse>;
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
  async resolveAddress(address: Address, chainId: number = 1): Promise<ReverseResponse> {
    const url = new URL(`/reverse/${address}`, this.options.endpointUrl);

    if (chainId !== 1) {
      url.searchParams.set("chainId", chainId.toString());
    }

    if (this.options.debug) {
      url.searchParams.set("debug", "true");
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Reverse resolution failed: ${error.error}`);
    }

    return response.json() as Promise<ReverseResponse>;
  }
}
