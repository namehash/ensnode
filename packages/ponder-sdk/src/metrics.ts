/**
 * Ponder SDK: Metrics
 *
 * This file describes ideas and functionality related to Ponder metrics for
 * each indexed chain. Ponder metrics are defined by `/metrics` endpoint.
 */

import { PrometheusMetrics } from "./prometheus/prometheus-metrics";
import { validatePonderMetrics } from "./validations";

export { PrometheusMetrics } from "./prometheus/prometheus-metrics";

/**
 * Fetch metrics for requested Ponder instance.
 *
 * @throws Will throw if the Ponder metrics are not valid.
 */
export async function fetchPonderMetrics(ponderAppUrl: URL): Promise<PrometheusMetrics> {
  const ponderMetricsUrl = new URL("/metrics", ponderAppUrl);

  try {
    const metricsText = await fetch(ponderMetricsUrl).then((r) => r.text());

    const ponderMetrics = PrometheusMetrics.parse(metricsText);

    validatePonderMetrics(ponderMetrics);

    return ponderMetrics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder metrics from '${ponderMetricsUrl}' due to: ${errorMessage}`,
    );
  }
}
