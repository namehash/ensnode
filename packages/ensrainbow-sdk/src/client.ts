import type { Labelhash } from "ensnode-utils/types";
import { DEFAULT_ENSRAINBOW_URL } from "./consts";
import type { HealError, HealResponse } from "./types";

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
export class EnsRainbowApiClient {
  private readonly options: EnsRainbowApiClientOptions;

  /**
   * Create default client options.
   *
   * @returns default options
   */
  static defaultOptions(): EnsRainbowApiClientOptions {
    return {
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
    };
  }

  constructor(options: Partial<EnsRainbowApiClientOptions> = {}) {
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
   * @param labelhash all lowercase hex string with 0x prefix with length of 66 characters in total
   * @returns
   *
   * @example
   * ```typescript
   * const response = await client.heal(
   *  "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
   * );
   *
   * console.log(response);
   *
   * // Output:
   * // {
   * //   status: "success",
   * //   label: "reverse",
   * // }
   * ```
   */
  async heal(labelhash: Labelhash): Promise<HealResponse> {
    try {
      const response = await fetch(new URL(`/v1/heal/${labelhash}`, this.options.endpointUrl));

      return response.json() as Promise<HealResponse>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        error: errorMessage,
        errorCode: 500,
        status: "error",
      } satisfies HealError;
    }
  }

  /**
   * Get current client options.
   *
   * @returns the current client options
   */
  getOptions(): EnsRainbowApiClientOptions {
    return this.options;
  }
}
