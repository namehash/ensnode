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
 * const nameResult = await client.resolveForward("vitalik.eth", {
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
   * Forward Resolution: Resolve records for an ENS name.
   *
   * @param name The ENS Name whose records to resolve
   * @param selection Optional selection of Resolver records
   * @returns ForwardResolutionResponse<SELECTION>
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * const { records } = await client.resolveForward("vitalik.eth", {
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
  async resolveForward<SELECTION extends ResolverRecordsSelection>(
    name: Name,
    selection: SELECTION,
    trace = false,
  ): Promise<ForwardResolutionResponse<SELECTION>> {
    const url = new URL(`/api/resolve/forward/${encodeURIComponent(name)}`, this.options.url);

    // Add query parameters based on selection
    if (selection.addresses && selection.addresses.length > 0) {
      url.searchParams.set("addresses", selection.addresses.join(","));
    }

    if (selection.texts && selection.texts.length > 0) {
      url.searchParams.set("texts", selection.texts.join(","));
    }

    if (trace) url.searchParams.set("trace", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Forward Resolution Failed: ${error.error}`);
    }

    const data = await response.json();
    return data as ForwardResolutionResponse<SELECTION>;
  }

  /**
   * Reverse Resolution: Resolve the Primary Name of an Address
   *
   * @param address The Address whose Primary Name to resolve
   * @param chainId Optional chain id within which to query the address' ENSIP-19 Multichain Primary
   *   Name (defaulting to Ethereum Mainnet [1])
   * @returns ReverseResolutionResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Name on Ethereum Mainnet
   * const { records } = await client.resolveReverse("0xabcd...");
   *
   * console.log(records);
   * // {
   * //   name: 'vitalik.eth',
   * //   avatar: 'https://example.com/image.jpg',
   * // }
   *
   * // Resolve the address' Primary Name on Optimism
   * const { records } = await client.resolveReverse("0xabcd...", 10);
   * ```
   */
  async resolveReverse(
    address: Address,
    chainId: number = 1,
    trace = false,
  ): Promise<ReverseResolutionResponse> {
    const url = new URL(`/api/resolve/reverse/${address}`, this.options.url);
    url.searchParams.set("chainId", chainId.toString());

    if (trace) url.searchParams.set("trace", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Reverse Resolution Failed: ${error.error}`);
    }

    const data = await response.json();
    return data as ReverseResolutionResponse;
  }
}
