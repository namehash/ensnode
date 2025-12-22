import {
  deserializePonderMetricsResponse,
  deserializePonderStatusResponse,
  type PonderMetricsResponse,
  type PonderStatusResponse,
} from "./response";

export class PonderClient {
  constructor(private ponderApplicationUrl: URL) {}

  /**
   * Ponder health check endpoint.
   *
   * @throws if the Ponder application request fails.
   * @throws if the Ponder application returns an error response.
   */
  public async health(): Promise<Response> {
    const response = await fetch(new URL("/status", this.ponderApplicationUrl));

    if (!response.ok) {
      throw new Error(
        `Ponder application health check failed with status: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }

  /**
   * Ponder readiness check endpoint.
   *
   * @throws if the Ponder application request fails.
   * @throws if the Ponder application returns an error response.
   */
  public async ready(): Promise<Response> {
    const response = await fetch(new URL("/ready", this.ponderApplicationUrl));

    if (!response.ok) {
      throw new Error(
        `Ponder application readiness check failed with status: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }

  /**
   * Ponder status
   *
   * @throws if the Ponder application request fails
   * @throws if the Ponder application returns an error response
   * @throws if the Ponder application response breaks required invariants
   */
  public async status(): Promise<PonderStatusResponse> {
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
    const response = await fetch(new URL("/metrics", this.ponderApplicationUrl));
    const responseText = await response.text();

    return deserializePonderMetricsResponse(responseText);
  }
}
