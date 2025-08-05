import type { Address } from "viem";
import { ErrorResponse, ForwardResolutionResponse, ReverseResolutionResponse } from "./api/types";
import type { Name } from "./ens";
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
 *   url: new URL("https://custom-api.ensnode.io"),
 * });
 * ```
 */
export class ENSNodeClient {
  private readonly options: ClientOptions;

  /**
   * Create default client options
   */
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

  /**
   * Get a copy of the current client options
   */
  getOptions(): Readonly<ClientOptions> {
    return Object.freeze({
      url: new URL(this.options.url.href),
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
  async resolveForward<SELECTION extends ResolverRecordsSelection>(
    name: Name,
    selection: SELECTION,
    debug = false,
  ): Promise<ForwardResolutionResponse<SELECTION>> {
    const url = new URL(`/api/resolve/forward/${encodeURIComponent(name)}`, this.options.url);

    // Add query parameters based on selection
    if (selection.addresses && selection.addresses.length > 0) {
      url.searchParams.set("addresses", selection.addresses.join(","));
    }

    if (selection.texts && selection.texts.length > 0) {
      url.searchParams.set("texts", selection.texts.join(","));
    }

    if (debug) url.searchParams.set("debug", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Forward Resolution Failed: ${error.error}`);
    }

    return response.json();
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
  async resolveAddress(
    address: Address,
    chainId: number = 1,
    debug = false,
  ): Promise<ReverseResolutionResponse> {
    const url = new URL(`/api/resolve/reverse/${address}`, this.options.url);
    url.searchParams.set("chainId", chainId.toString());

    if (debug) url.searchParams.set("debug", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Reverse Resolution Failed: ${error.error}`);
    }

    return response.json();
  }
}
