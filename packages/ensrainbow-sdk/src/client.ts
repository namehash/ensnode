import type { Cache } from "@ensnode/utils/cache";
import { LruCache } from "@ensnode/utils/cache";
import type { Labelhash } from "@ensnode/utils/types";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";

export namespace EnsRainbow {
  export type ApiClientOptions = EnsRainbowApiClientOptions;

  export interface ApiClient {
    count(): Promise<CountResponse>;

    heal(labelhash: Labelhash): Promise<HealResponse>;

    health(): Promise<HealthResponse>;

    version(): Promise<VersionResponse>;

    getOptions(): Readonly<EnsRainbowApiClientOptions>;
  }

  type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

  type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

  export interface HealthResponse {
    status: "ok" | "error";
    error?: string;
  }

  export interface BaseHealResponse<Status extends StatusCode, Error extends ErrorCode> {
    status: Status;
    label?: string | never;
    error?: string | never;
    errorCode?: Error | never;
  }

  export interface HealSuccess extends BaseHealResponse<typeof StatusCode.Success, never> {
    status: typeof StatusCode.Success;
    label: string;
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

  export interface HealTimeoutError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.TIMEOUT> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.TIMEOUT;
  }

  export interface HealNetworkOfflineError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.NETWORK_OFFLINE> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.NETWORK_OFFLINE;
  }

  export interface HealGeneralNetworkError
    extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.GENERAL_NETWORK_ERROR> {
    status: typeof StatusCode.Error;
    label?: never;
    error: string;
    errorCode: typeof ErrorCode.GENERAL_NETWORK_ERROR;
  }

  export type HealResponse =
    | HealSuccess
    | HealNotFoundError
    | HealServerError
    | HealBadRequestError
    | HealTimeoutError
    | HealNetworkOfflineError
    | HealGeneralNetworkError;

  export type HealError = Exclude<HealResponse, HealSuccess>;

  /**
   * Server errors should not be cached.
   */
  export type CacheableHealResponse = Exclude<
    HealResponse,
    HealServerError | HealTimeoutError | HealNetworkOfflineError | HealGeneralNetworkError
  >;

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

  export interface CountNetworkError
    extends BaseCountResponse<typeof StatusCode.Error, typeof ErrorCode.GENERAL_NETWORK_ERROR> {
    status: typeof StatusCode.Error;
    count?: never;
    timestamp?: never;
    error: string;
    errorCode: typeof ErrorCode.GENERAL_NETWORK_ERROR;
  }

  export interface CountTimeoutError
    extends BaseCountResponse<typeof StatusCode.Error, typeof ErrorCode.TIMEOUT> {
    status: typeof StatusCode.Error;
    count?: never;
    timestamp?: never;
    error: string;
    errorCode: typeof ErrorCode.TIMEOUT;
  }

  export interface CountNetworkOfflineError
    extends BaseCountResponse<typeof StatusCode.Error, typeof ErrorCode.NETWORK_OFFLINE> {
    status: typeof StatusCode.Error;
    count?: never;
    timestamp?: never;
    error: string;
    errorCode: typeof ErrorCode.NETWORK_OFFLINE;
  }

  export type CountResponse =
    | CountSuccess
    | CountServerError
    | CountNetworkError
    | CountTimeoutError
    | CountNetworkOfflineError;

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

  /**
   * Default timeout for API requests in milliseconds.
   * Defaults to 10000 (10 seconds).
   */
  requestTimeout?: number;
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
  private readonly cache: Cache<Labelhash, EnsRainbow.CacheableHealResponse>;

  public static readonly DEFAULT_CACHE_CAPACITY = 1000;
  public static readonly DEFAULT_REQUEST_TIMEOUT = 10000;

  /**
   * Create default client options.
   *
   * @returns default options
   */
  static defaultOptions(): EnsRainbow.ApiClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
      cacheCapacity: EnsRainbowApiClient.DEFAULT_CACHE_CAPACITY,
      requestTimeout: EnsRainbowApiClient.DEFAULT_REQUEST_TIMEOUT,
    };
  }

  constructor(options: Partial<EnsRainbow.ApiClientOptions> = {}) {
    this.options = {
      ...EnsRainbowApiClient.defaultOptions(),
      ...options,
    };

    this.cache = new LruCache<Labelhash, EnsRainbow.CacheableHealResponse>(
      this.options.cacheCapacity,
    );
  }

  /**
   * Helper method to fetch data with timeout handling
   *
   * @param endpoint - The endpoint to fetch from
   * @returns The response JSON data
   * @throws Will throw an error if the fetch fails
   */
  private async fetchWithTimeout<T>(endpoint: string): Promise<T> {
    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeout = this.options.requestTimeout || EnsRainbowApiClient.DEFAULT_REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(new URL(endpoint, this.options.endpointUrl), {
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      return response.json() as Promise<T>;
    } catch (error) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      throw error; // Re-throw to be caught by the caller
    }
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
  async heal(labelhash: Labelhash): Promise<EnsRainbow.HealResponse> {
    const cachedResult = this.cache.get(labelhash);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const healResponse = await this.fetchWithTimeout<EnsRainbow.HealResponse>(
        `/v1/heal/${labelhash}`,
      );

      if (isCacheableHealResponse(healResponse)) {
        this.cache.set(labelhash, healResponse);
      }

      return healResponse;
    } catch (error) {
      // Handle network errors
      return this.createNetworkErrorResponse(error);
    }
  }

  /**
   * Helper method to create appropriate network error responses
   */
  private createNetworkErrorResponse(error: unknown): EnsRainbow.HealResponse {
    let errorMessage = "Unknown network error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;

      // DOMException is thrown for aborts, including timeouts
      if (error.name === "AbortError") {
        return {
          status: StatusCode.Error,
          error: "Request timed out",
          errorCode: ErrorCode.TIMEOUT,
        } as EnsRainbow.HealTimeoutError;
      }

      // Network connectivity issues
      if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("failed to fetch")
      ) {
        return {
          status: StatusCode.Error,
          error: "Network connection lost or unavailable",
          errorCode: ErrorCode.NETWORK_OFFLINE,
        } as EnsRainbow.HealNetworkOfflineError;
      }
    }

    // Default to general network error
    return {
      status: StatusCode.Error,
      error: errorMessage,
      errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
    } as EnsRainbow.HealGeneralNetworkError;
  }

  /**
   * Get Count of Healable Labels
   *
   * @returns a `CountResponse` indicating the result and the timestamp of the request and the number of healable labels if successful
   * @example
   *
   * const response = await client.count();
   *
   * console.log(response);
   *
   * // Success case:
   * // {
   * //   "status": "success",
   * //   "count": 133856894,
   * //   "timestamp": "2024-01-30T11:18:56Z"
   * // }
   *
   * // Server error case:
   * // {
   * //   "status": "error",
   * //   "error": "Server error",
   * //   "errorCode": 500
   * // }
   *
   * // Network timeout error case:
   * // {
   * //   "status": "error",
   * //   "error": "Connection timed out",
   * //   "errorCode": 1000
   * // }
   *
   * // Network offline error case:
   * // {
   * //   "status": "error",
   * //   "error": "Server is unreachable",
   * //   "errorCode": 1001
   * // }
   *
   * // General network error case:
   * // {
   * //   "status": "error",
   * //   "error": "Unknown network error",
   * //   "errorCode": 1099
   * // }
   */
  async count(): Promise<EnsRainbow.CountResponse> {
    try {
      return await this.fetchWithTimeout<EnsRainbow.CountResponse>("/v1/labels/count");
    } catch (error) {
      // Handle network errors
      return this.createCountNetworkErrorResponse(error);
    }
  }

  /**
   * Helper method to create appropriate network error responses for count
   */
  private createCountNetworkErrorResponse(error: unknown): EnsRainbow.CountResponse {
    let errorMessage = "Unknown network error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;

      // DOMException is thrown for aborts, including timeouts
      if (error.name === "AbortError") {
        return {
          status: StatusCode.Error,
          error: "Request timed out",
          errorCode: ErrorCode.TIMEOUT,
        } as EnsRainbow.CountTimeoutError;
      }

      // Network connectivity issues
      if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("failed to fetch") ||
        errorMessage.toLowerCase().includes("fetch failed")
      ) {
        return {
          status: StatusCode.Error,
          error: "Network connection lost or unavailable",
          errorCode: ErrorCode.NETWORK_OFFLINE,
        } as EnsRainbow.CountNetworkOfflineError;
      }
    }

    // Default to general network error
    return {
      status: StatusCode.Error,
      error: errorMessage,
      errorCode: ErrorCode.GENERAL_NETWORK_ERROR,
    } as EnsRainbow.CountNetworkError;
  }

  /**
   * Simple verification that the service is running
   *
   * @returns a status of ENS Rainbow service
   * @example
   *
   * const response = await client.health();
   *
   * console.log(response);
   *
   * // Success case:
   * // {
   * //   "status": "ok"
   * // }
   *
   * // Error case:
   * // {
   * //   "status": "error",
   * //   "error": "Server is unreachable"
   * // }
   */
  async health(): Promise<EnsRainbow.HealthResponse> {
    try {
      return await this.fetchWithTimeout<EnsRainbow.HealthResponse>("/health");
    } catch (error) {
      // For health checks, we'll return a custom error status
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown network error",
      };
    }
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
      requestTimeout: this.options.requestTimeout,
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
  return (
    response.status === StatusCode.Success ||
    (response.status === StatusCode.Error &&
      response.errorCode !== ErrorCode.ServerError &&
      response.errorCode !== ErrorCode.TIMEOUT &&
      response.errorCode !== ErrorCode.NETWORK_OFFLINE &&
      response.errorCode !== ErrorCode.GENERAL_NETWORK_ERROR)
  );
};

/**
 * Determines if a heal error is retryable (i.e., it's a network error)
 *
 * @param error - The heal error to check
 * @returns true if the error is a network error (TIMEOUT, NETWORK_OFFLINE, or GENERAL_NETWORK_ERROR), false otherwise
 */
export const isRetryableHealError = (error: EnsRainbow.HealError): boolean => {
  return (
    error.errorCode === ErrorCode.TIMEOUT ||
    error.errorCode === ErrorCode.NETWORK_OFFLINE ||
    error.errorCode === ErrorCode.GENERAL_NETWORK_ERROR
  );
};
