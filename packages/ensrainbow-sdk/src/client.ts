import type { HealError, HealResponse, Labelhash } from "./types";

export interface EnsRainbowApiClientOptions {
  endpointUrl: URL;
}

/**
 * ENSRainbow API client
 *
 * @example
 * ```typescript
 * const client = new EnsRainbowApiClient({
 *  endpointUrl: new URL("https://api.ensrainbow.io"),
 * });
 * ```
 */
export class EnsRainbowApiClient {
  constructor(private readonly options: EnsRainbowApiClientOptions) {}

  /**
   * Heal a labelhash to its original label.
   *
   * Note on returned labels: The service returns labels exactly as they appear in the source data. This means:
   *
   * - Labels may or may not be ENS-normalized
   * - Labels can contain any valid string, including dots, null bytes, or be empty
   * - Clients should handle all possible string values appropriately
   *
   * @param labelhash
   * @returns
   *
   * @link https://github.com/namehash/ensnode/tree/effc77d/apps/ensrainbow#heal-label
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
}
