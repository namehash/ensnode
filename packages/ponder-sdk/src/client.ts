import { deserializePonderIndexingMetrics } from "./deserialize/indexing-metrics";
import { deserializePonderIndexingStatus } from "./deserialize/indexing-status";
import type { PonderIndexingMetrics } from "./indexing-metrics";
import type { PonderIndexingStatus } from "./indexing-status";

/**
 * PonderClient for fetching data from Ponder apps.
 */
export class PonderClient {
  constructor(private readonly baseUrl: URL) {}

  /**
   * Check Ponder Health
   *
   * If the Ponder instance is healthy, this method resolves successfully.
   *
   * @throws Error if the health check fails.
   */
  async health(): Promise<void> {
    const requestUrl = new URL("/health", this.baseUrl);
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Ponder health response: ${response.status} ${response.statusText}`,
      );
    }
  }

  /**
   * Get Ponder Indexing Metrics
   *
   * @returns Ponder Indexing Metrics.
   * @throws Error if the response could not be fetched or was invalid.
   */
  async metrics(): Promise<PonderIndexingMetrics> {
    const requestUrl = new URL("/metrics", this.baseUrl);
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Ponder Indexing Metrics response: ${response.status} ${response.statusText}`,
      );
    }

    const responseText = await response.text();

    return deserializePonderIndexingMetrics(responseText);
  }

  /**
   * Get Ponder Indexing Status
   *
   * @returns Ponder Indexing Status.
   * @throws Error if the response could not be fetched or was invalid.
   */
  async status(): Promise<PonderIndexingStatus> {
    const requestUrl = new URL("/status", this.baseUrl);
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Ponder Indexing Status response: ${response.status} ${response.statusText}`,
      );
    }

    let responseData: unknown;

    try {
      responseData = await response.json();
    } catch {
      throw new Error("Failed to parse Ponder Indexing Status response as JSON");
    }

    return deserializePonderIndexingStatus(responseData);
  }
}
