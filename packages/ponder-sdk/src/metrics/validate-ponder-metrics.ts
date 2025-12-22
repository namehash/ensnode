import type { PrometheusMetrics } from "./prometheus-metrics";

/**
 * Validate Ponder Metrics
 *
 * @param metrics - Prometheus Metrics from Ponder
 *
 * @throws Will throw if the Ponder metrics are not valid.
 */
export function validatePonderMetrics(metrics: PrometheusMetrics) {
  // Invariant: Ponder command & ordering are as expected
  const command = metrics.getLabel("ponder_settings_info", "command");
  const ordering = metrics.getLabel("ponder_settings_info", "ordering");

  if (typeof command !== "string" || !["dev", "start"].includes(command)) {
    throw new Error(
      `Ponder settings_info command label is invalid: expected "dev" or "start", got "${command}"`,
    );
  }

  if (ordering !== "omnichain") {
    throw new Error(
      `Ponder settings_info ordering label is invalid: expected "omnichain", got "${ordering}"`,
    );
  }
}
