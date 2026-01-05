import {
  deserializePonderMetricsResponse,
  deserializePonderStatusResponse,
  type PonderMetricsResponse,
  type PonderStatusResponse,
} from "./response";

export const PonderHealthCheckResults = {
  /**
   * Ponder Health is unknown if the health check endpoint is unavailable.
   */
  Unknown: "unknown",

  /**
   * Ponder Health is not OK if the health check endpoint returned
   * HTTP status other than `2xx`.
   */
  NotOk: "not-ok",

  /**
   * Ponder Health is OK if the health check endpoint returned
   * `2xx` HTTP status.
   */
  Ok: "ok",
} as const;

export type PonderHealthCheckResult =
  (typeof PonderHealthCheckResults)[keyof typeof PonderHealthCheckResults];

export class PonderClient {
  #healthCheckResult: PonderHealthCheckResult | undefined;

  constructor(private ponderApplicationUrl: URL) {}

  /**
   * Ponder health check endpoint.
   *
   * @returns Ponder health check result.
   */
  public async health(): Promise<PonderHealthCheckResult> {
    let response: Response;

    try {
      response = await fetch(new URL("/health", this.ponderApplicationUrl));

      if (!response.ok) {
        this.#healthCheckResult = PonderHealthCheckResults.NotOk;
      } else {
        this.#healthCheckResult = PonderHealthCheckResults.Ok;
      }
    } catch {
      this.#healthCheckResult = PonderHealthCheckResults.Unknown;
    }

    return this.#healthCheckResult;
  }

  /**
   * Is Ponder app "ready"?
   *
   * @throws error about Ponder `/ready` endpoint not being supported.
   *         ENSNode makes no use of that endpoint.
   */
  public ready(): never {
    throw new Error("Ponder `/ready` endpoint is not supported by this client.");
  }

  /**
   * Ponder status
   *
   * @throws if the Ponder application request fails
   * @throws if the Ponder application returns an error response
   * @throws if the Ponder application response breaks required invariants
   */
  public async status(): Promise<PonderStatusResponse> {
    this.validateHealthCheckResult();

    const response = await fetch(new URL("/status", this.ponderApplicationUrl));
    const responseJson = await response.json();

    return deserializePonderStatusResponse(responseJson);
  }

  /**
   * Ponder metrics
   *
   * @throws if the Ponder application request fails
   * @throws if the Ponder application returns an error response
   * @throws if the Ponder application response breaks required invariants
   */
  public async metrics(): Promise<PonderMetricsResponse> {
    this.validateHealthCheckResult();

    const response = await fetch(new URL("/metrics", this.ponderApplicationUrl));
    const responseText = await response.text();

    return deserializePonderMetricsResponse(responseText);
  }

  /**
   * Validate ENSIndexer health check result.
   *
   * @throws if the health check result is other than
   * {@link PonderHealthCheckResults.Ok}.
   */
  private validateHealthCheckResult(): void {
    if (typeof this.#healthCheckResult === "undefined") {
      throw new Error(
        "Running health check for Ponder application is required. Call the 'health()' method first.",
      );
    }

    if (this.#healthCheckResult !== PonderHealthCheckResults.Ok) {
      throw new Error(
        `Ponder application must be healthy. Current health check result is '${this.#healthCheckResult}'. You can keep calling the 'health()' method until it returns the 'ok' result.`,
      );
    }
  }
}
