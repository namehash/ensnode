import { type Cache, Label, type LabelHash, LruCache } from "@ensnode/ensnode-sdk";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";

export namespace EnsRainbow {
  export type ApiClientOptions = EnsRainbowApiClientOptions;

  export interface ApiClient {
    count(): Promise<CountResponse>;

    heal(labelHash: LabelHash): Promise<HealResponse>;

    health(): Promise<HealthResponse>;

    version(): Promise<VersionResponse>;

    getOptions(): Readonly<EnsRainbowApiClientOptions>;
  }

  type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

  type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

  export interface HealthResponse {
    status: "ok";
  }

  export interface BaseHealResponse<Status extends StatusCode, Error extends ErrorCode> {
    status: Status;
    label?: Label | never;
    error?: string | never;
    errorCode?: Error | never;
  }

  export interface HealSuccess extends BaseHealResponse<typeof StatusCode.Success, never> {
    status: typeof StatusCode.Success;
    label: Label;
    error?: never;
    errorCode?: never;
  }

  export interface HealNotFoundError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.NotFound> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.NotFound;
  }

  export interface HealServerError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.ServerError> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.ServerError;
  }

  export interface HealBadRequestError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.BadRequest> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.BadRequest;
  }

  export type HealResponse =
    | HealSuccess
    | HealNotFoundError
    | HealServerError
    | HealBadRequestError;
  export type HealError = Exclude<HealResponse, HealSuccess>;

  /**
   * Server errors should not be cached.
   */
  export type CacheableHealResponse = Exclude<HealResponse, HealServerError>;

  export interface BaseCountResponse<Status extends StatusCode, Error extends ErrorCode> {
    status: Status;
    count?: number | never;
    timestamp?: string | never;
    error?: string | never;
    errorCode?: Error | never;
  }

  export interface CountSuccess extends BaseCountResponse<typeof StatusCode.Success, never> {
    status: typeof StatusCode.Success;
    /** The total count of labels that can be healed by the ENSRainbow instance. Always a non-negative integer. */
    count: number;
    timestamp: string;
    error?: never;
    errorCode?: never;
  }

  export interface CountServerError
    extends BaseCountResponse<typeof StatusCode.Error, typeof ErrorCode.ServerError> {
    status: typeof StatusCode.Error;
    count?: never;
    timestamp?: never;
    error: string;
    errorCode: typeof ErrorCode.ServerError;
  }

  export type CountResponse = CountSuccess | CountServerError;

  /**
   * ENSRainbow version information.
   */
  export interface VersionInfo {
    /**
     * ENSRainbow version.
     */
    version: string;

    /**
     * ENSRainbow schema version.
     */
    schema_version: number;
  }

  /**
   * Interface for the version endpoint response
   */
  export interface VersionResponse {
    status: typeof StatusCode.Success;
    versionInfo: VersionInfo;
  }
}

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
export class EnsRainbowApiClient implements EnsRainbow.ApiClient {
  private readonly options: EnsRainbowApiClientOptions;
  private readonly cache: Cache<LabelHash, EnsRainbow.CacheableHealResponse>;

  public static readonly DEFAULT_CACHE_CAPACITY = 1000;

  /**
   * Create default client options.
   *
   * @returns default options
   */
  static defaultOptions(): EnsRainbow.ApiClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheCapacity: EnsRainbowApiClient.DEFAULT_CACHE_CAPACITY,
    };
  }

  constructor(options: Partial<EnsRainbow.ApiClientOptions> = {}) {
    this.options = {
      ...EnsRainbowApiClient.defaultOptions(),
      ...options,
    };

    this.cache = new LruCache<LabelHash, EnsRainbow.CacheableHealResponse>(
      this.options.cacheCapacity,
    );
  }

  /**
   * Attempt to heal a labelHash to its original label.
   *
   * Note on returned labels: ENSRainbow returns labels exactly as they are
   * represented in source rainbow table data. This means:
   *
   * - Labels may or may not be ENS-normalized
   * - Labels can contain any valid string, including dots, null bytes, or be empty
   * - Clients should handle all possible string values appropriately
   *
   * @param labelHash all lowercase 64-digit hex string with 0x prefix (total length of 66 characters)
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
  async heal(labelHash: LabelHash): Promise<EnsRainbow.HealResponse> {
    const cachedResult = this.cache.get(labelHash);

    if (cachedResult) {
      return cachedResult;
    }

    const response = await fetch(new URL(`/v1/heal/${labelHash}`, this.options.endpointUrl));
    const healResponse = (await response.json()) as EnsRainbow.HealResponse;

    if (isCacheableHealResponse(healResponse)) {
      this.cache.set(labelHash, healResponse);
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
   * Get the version information of the ENSRainbow service
   *
   * @returns the version information of the ENSRainbow service
   * @throws if the request fails due to network failures, DNS lookup failures, request timeouts, CORS violations, or Invalid URLs
   *
   * @example
   * ```typescript
   * const response = await client.version();
   *
   * console.log(response);
   *
   * // {
   * //   "status": "success",
   * //   "version": "0.1.0",
   * //   "schema_version": 2
   * // }
   * ```
   */
  async version(): Promise<EnsRainbow.VersionResponse> {
    const response = await fetch(new URL("/v1/version", this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.VersionResponse>;
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

/**
 * Determine if a heal response is an error.
 *
 * @param response the heal response to check
 * @returns true if the response is an error, false otherwise
 */
export const isHealError = (
  response: EnsRainbow.HealResponse,
): response is EnsRainbow.HealError => {
  return response.status === StatusCode.Error;
};

/**
 * Determine if a heal response is cacheable.
 *
 * Server errors at not cachable and should be retried.
 *
 * @param response the heal response to check
 * @returns true if the response is cacheable, false otherwise
 */
export const isCacheableHealResponse = (
  response: EnsRainbow.HealResponse,
): response is EnsRainbow.CacheableHealResponse => {
  return response.status === StatusCode.Success || response.errorCode !== ErrorCode.ServerError;
};
