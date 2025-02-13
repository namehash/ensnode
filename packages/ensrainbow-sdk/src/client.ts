import type { Cache } from "@ensnode/utils/cache";
import { LruCache } from "@ensnode/utils/cache";
import type { Labelhash } from "@ensnode/utils/types";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";
import type { HealResponse } from "./types";

export interface EnsRainbowApiClientOptions {
  /**
   * The maximum number of `HealResponse` values to cache.
   * Must be a non-negative integer.
   * Setting to 0 will disable caching.
   */
  cacheCapacity: number;

  /**
   * The URL of the ENSRainbow API endpoint.
   */
  endpointUrl: URL;
}

/**
 * ENSRainbow API client
 *
 * @example
 * ```typescript
 * // default options
 * const client = new EnsRainbowApiClient();
 * // custom options
 * const client = new EnsRainbowApiClient({
 *  endpointUrl: new URL("https://api.ensrainbow.io"),
 * });
 * ```
 */
export class EnsRainbowApiClient {
  private readonly options: EnsRainbowApiClientOptions;
  private readonly cache: Cache<Labelhash, HealResponse>;

  public static readonly DEFAULT_CACHE_CAPACITY = 1000;

  /**
   * Create default client options.
   *
   * @returns default options
   */
  static defaultOptions(): EnsRainbowApiClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheCapacity: EnsRainbowApiClient.DEFAULT_CACHE_CAPACITY,
    };
  }

  constructor(options: Partial<EnsRainbowApiClientOptions> = {}) {
    this.options = {
      ...EnsRainbowApiClient.defaultOptions(),
      ...options,
    };

    this.cache = new LruCache<HealResponse>(this.options.cacheCapacity);
  }

  /**
   * Determine if a heal response is cacheable.
   *
   * Server errors at not cachable and should be retried.
   *
   * @param response the heal response to check
   * @returns true if the response is cacheable, false otherwise
   */
  public static isCacheableHealResponse(response: HealResponse): boolean {
    return response.status !== StatusCode.Error || response.errorCode !== ErrorCode.ServerError;
  }

  /**
   * Attempt to heal a labelhash to its original label.
   *
   * Note on returned labels: ENSRainbow returns labels exactly as they are
   * represented in source rainbow table data. This means:
   *
   * - Labels may or may not be ENS-normalized
   * - Labels can contain any valid string, including dots, null bytes, or be empty
   * - Clients should handle all possible string values appropriately
   *
   * @param labelhash all lowercase 64-digit hex string with 0x prefix (total length of 66 characters)
   * @returns a `HealResponse` indicating the result of the request and the healed label if successful
   * @throws if the request fails due to network failures, DNS lookup failures, request timeouts, CORS violations, or Invalid URLs
   *
   * @example
   * ```typescript
   * const response = await client.heal(
   *   "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
   * );
   *
   * console.log(response);
   *
   * // Output:
   * // {
   * //   status: "success",
   * //   label: "vitalik"
   * // }
   *
   * const notFoundResponse = await client.heal(
   *   "0xf64dc17ae2e2b9b16dbcb8cb05f35a2e6080a5ff1dc53ac0bc48f0e79111f264"
   * );
   *
   * console.log(notFoundResponse);
   *
   * // Output:
   * // {
   * //   status: "error",
   * //   error: "Label not found",
   * //   errorCode: 404
   * // }
   * ```
   */
  async heal(labelhash: Labelhash): Promise<HealResponse> {
    const cachedResult = this.cache.get(labelhash);

    if (cachedResult) {
      return cachedResult;
    }

    const response = await fetch(new URL(`/v1/heal/${labelhash}`, this.options.endpointUrl));
    const healResponse = (await response.json()) as HealResponse;

    if (EnsRainbowApiClient.isCacheableHealResponse(healResponse)) {
      this.cache.set(labelhash, healResponse);
    }

    return healResponse;
  }

  /**
   * Get current client options.
   *
   * @returns the current client options
   */
  getOptions(): Readonly<EnsRainbowApiClientOptions> {
    return Object.freeze(this.options);
  }
}
