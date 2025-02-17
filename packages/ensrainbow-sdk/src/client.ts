import type {Cache} from "@ensnode/utils/cache";
import {LruCache} from "@ensnode/utils/cache";
import type {Labelhash} from "@ensnode/utils/types";
import {DEFAULT_ENSRAINBOW_URL} from "./consts";
import type {CacheableHealResponse, CountResponse, HealResponse, HealthResponse} from "./types";
import {isCacheableHealResponse} from "./types";

export interface EnsRainbowApiClientOptions {
  /**
   * The maximum number of `HealResponse` values to cache.
   * Must be a non-negative integer.
   * Setting to 0 will disable caching.
   */
  cacheCapacity: number;

  /**
   * The URL of an ENSRainbow API endpoint.
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
  private readonly cache: Cache<Labelhash, CacheableHealResponse>;

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

    this.cache = new LruCache<Labelhash, CacheableHealResponse>(this.options.cacheCapacity);
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

    if (isCacheableHealResponse(healResponse)) {
      this.cache.set(labelhash, healResponse);
    }

    return healResponse;
  }

  /**
   * Get Count of Healable Labels
   *
   * @returns a `CountResponse` indicating the result and the timestamp of the request and the number of healable labels if successful
   * @throws if the request fails due to network failures, DNS lookup failures, request timeouts, CORS violations, or Invalid URLs
   *
   * @example
   *
   * const response = await client.count();
   *
   * console.log(response);
   *
   * // {
   * //   "status": "success",
   * //   "count": 133856894,
   * //   "timestamp": "2024-01-30T11:18:56Z"
   * // }
   *
   */
  async count(): Promise<EnsRainbow.CountResponse> {
    const response = await fetch(new URL("/v1/labels/count", this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.CountResponse>;
  }

  /**
   *
   * Simple verification that the service is running, either in your local setup or for the provided hosted instance
   *
   * @returns a status of ENS Rainbow service
   * @example
   *
   * const response = await client.health();
   *
   * console.log(response);
   *
   * // {
   * //   "status": "ok",
   * // }
   */
  async health(): Promise<EnsRainbow.HealthResponse> {
    const response = await fetch(new URL("/health", this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.HealthResponse>;
  }

  /**
   * Get a copy of the current client options.
   *
   * @returns a copy of the current client options.
   */
  getOptions(): Readonly<EnsRainbowApiClientOptions> {
    // build a deep copy to prevent modification
    const deepCopy = {
      cacheCapacity: this.options.cacheCapacity,
      endpointUrl: new URL(this.options.endpointUrl.href),
    } satisfies EnsRainbowApiClientOptions;

    return Object.freeze(deepCopy);
  }
}
