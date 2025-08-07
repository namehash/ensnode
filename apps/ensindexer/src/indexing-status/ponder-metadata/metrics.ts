import { PrometheusMetrics } from "@ensnode/ponder-metadata";

/**
 * Fetch metrics for requested Ponder instance.
 */
export async function fetchPonderMetrics(ponderAppUrl: URL): Promise<PrometheusMetrics> {
  const ponderMetricsUrl = new URL("/metrics", ponderAppUrl);

  try {
    const metricsText = await fetch(ponderMetricsUrl).then((r) => r.text());

    return PrometheusMetrics.parse(metricsText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder metrics from '${ponderMetricsUrl}' due to: ${errorMessage}`,
    );
  }
}
