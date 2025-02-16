import type { Labelhash } from "@ensnode/utils/types";
import { DEFAULT_ENSRAINBOW_URL, ErrorCode, StatusCode } from "./consts";

export namespace EnsRainbow {
  export type ApiClientOptions = EnsRainbowApiClientOptions;

  export interface ApiClient {
    count(): Promise<CountResponse>;

    heal(labelhash: Labelhash): Promise<HealResponse>;

    health(): Promise<HealthResponse>;

    getOptions(): Readonly<EnsRainbowApiClientOptions>;
  }

  type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

  type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

  export interface HealthResponse {
    status: "ok";
  }

  interface BaseHealResponse<Status extends StatusCode> {
    status: Status;
    label?: string | undefined;
    error?: string | undefined;
    errorCode?: ErrorCode | undefined;
  }

  export interface HealSuccess extends BaseHealResponse<typeof StatusCode.Success> {
    status: typeof StatusCode.Success;
    label: string;
    error?: undefined;
    errorCode?: undefined;
  }

  export interface HealError extends BaseHealResponse<typeof StatusCode.Error> {
    status: typeof StatusCode.Error;
    label?: undefined;
    error: string;
    errorCode: ErrorCode;
  }

  export type HealResponse = HealSuccess | HealError;

  interface BaseCountResponse<Status extends StatusCode> {
    status: Status;
    count?: number | undefined;
    timestamp?: string | undefined;
    error?: string | undefined;
    errorCode?: ErrorCode | undefined;
  }

  export interface CountSuccess extends BaseCountResponse<typeof StatusCode.Success> {
    status: typeof StatusCode.Success;
    /** The total count of labels that can be healed by the ENSRainbow instance. Always a non-negative integer. */
    count: number;
    timestamp: string;
    error?: undefined;
    errorCode?: undefined;
  }

  export interface CountError extends BaseCountResponse<typeof StatusCode.Error> {
    status: typeof StatusCode.Error;
    count?: undefined;
    timestamp?: undefined;
    error: string;
    errorCode: ErrorCode;
  }

  export type CountResponse = CountSuccess | CountError;
}

export interface EnsRainbowApiClientOptions {
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

  /**
   * Create default client options.
   *
   * @returns default options
   */
  static defaultOptions(): EnsRainbow.ApiClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
    };
  }

  constructor(options: Partial<EnsRainbow.ApiClientOptions> = {}) {
    this.options = {
      ...EnsRainbowApiClient.defaultOptions(),
      ...options,
    };
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
  async heal(labelhash: Labelhash): Promise<EnsRainbow.HealResponse> {
    const response = await fetch(new URL(`/v1/heal/${labelhash}`, this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.HealResponse>;
  }

  async count(): Promise<EnsRainbow.CountResponse> {
    const response = await fetch(new URL("/v1/labels/count", this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.CountResponse>;
  }

  async health(): Promise<EnsRainbow.HealthResponse> {
    const response = await fetch(new URL("/health", this.options.endpointUrl));

    return response.json() as Promise<EnsRainbow.HealthResponse>;
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
