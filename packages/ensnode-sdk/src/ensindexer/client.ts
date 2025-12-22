import {
  deserializeENSIndexerPublicConfig,
  deserializeIndexingStatusResponse,
  type ENSIndexerPublicConfig,
  type IndexingStatusResponse,
  type SerializedENSIndexerPublicConfig,
  type SerializedIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

export const EnsIndexerHealthCheckResults = {
  /**
   * ENSIndexer Health is unknown if the health check endpoint is unavailable.
   */
  Unknown: "unknown",

  /**
   * ENSIndexer Health is not OK if the health check endpoint returned
   * HTTP status other than `2xx`.
   */
  NotOk: "not-ok",

  /**
   * ENSIndexer Health is OK if the health check endpoint returned
   * `2xx` HTTP status.
   */
  Ok: "ok",
} as const;

export type EnsIndexerHealthCheckResult =
  (typeof EnsIndexerHealthCheckResults)[keyof typeof EnsIndexerHealthCheckResults];

/**
 * ENSIndexer Client
 *
 * Using this client methods requires first calling `health()` method and
 * waiting for it to return {@link EnsIndexerHealthCheckResults.Ok} result.
 */
export class EnsIndexerClient {
  #healthCheckResult: EnsIndexerHealthCheckResult | undefined;

  constructor(private ensIndexerUrl: URL) {}

  /**
   * ENSIndexer health check endpoint.
   *
   * @returns ENSIndexer health check result.
   */
  public async health(): Promise<EnsIndexerHealthCheckResult> {
    let response: Response;

    try {
      response = await fetch(new URL("/health", this.ensIndexerUrl));

      if (!response.ok) {
        this.#healthCheckResult = EnsIndexerHealthCheckResults.NotOk;
      } else {
        this.#healthCheckResult = EnsIndexerHealthCheckResults.Ok;
      }
    } catch {
      this.#healthCheckResult = EnsIndexerHealthCheckResults.Unknown;
    }

    return this.#healthCheckResult;
  }

  /**
   * Fetch ENSIndexer Public Config
   *
   * @returns ENSIndexer Public Config
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer returns an error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  public async config(): Promise<ENSIndexerPublicConfig> {
    this.validateEnsIndexerHealthCheckResult();

    const ensIndexerPublicConfigSerialized = await fetch(
      new URL("/api/config", this.ensIndexerUrl),
    ).then((response) => response.json());

    return deserializeENSIndexerPublicConfig(
      ensIndexerPublicConfigSerialized as SerializedENSIndexerPublicConfig,
    );
  }

  /**
   * Fetch ENSIndexer Indexing Status
   *
   * @returns ENSIndexer Indexing Status
   *
   * @throws if the ENSIndexer request fails
   * @throws if the ENSIndexer returns an error response
   * @throws if the ENSIndexer response breaks required invariants
   */
  public async indexingStatus(): Promise<IndexingStatusResponse> {
    this.validateEnsIndexerHealthCheckResult();

    const indexingStatusSerialized = await fetch(
      new URL("/api/indexing-status", this.ensIndexerUrl),
    ).then((response) => response.json());

    return deserializeIndexingStatusResponse(
      indexingStatusSerialized as SerializedIndexingStatusResponse,
    );
  }

  /**
   * Validate ENSIndexer health check result.
   *
   * @throws if the health check result is other than
   * {@link EnsIndexerHealthCheckResults.Ok}.
   */
  private validateEnsIndexerHealthCheckResult(): void {
    if (typeof this.#healthCheckResult === "undefined") {
      throw new Error(
        "Running health check for ENSIndexer is required. Call the 'health()' method first.",
      );
    }

    if (this.#healthCheckResult !== EnsIndexerHealthCheckResults.Ok) {
      throw new Error(
        `ENSIndexer must be healthy. Current health check result is '${this.#healthCheckResult}'. You can keep calling the 'health()' method until it returns the 'ok' result.`,
      );
    }
  }
}
