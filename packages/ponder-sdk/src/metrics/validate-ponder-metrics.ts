import { prettifyError } from "zod/v4";

import { PonderAppSettingsSchema } from "../zod-schemas";
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
  const parsedAppSettings = PonderAppSettingsSchema.safeParse({
    command: metrics.getLabel("ponder_settings_info", "command"),
    ordering: metrics.getLabel("ponder_settings_info", "ordering"),
  });

  if (parsedAppSettings.error) {
    throw new Error(
      `Failed to build IndexingStatus object: \n${prettifyError(parsedAppSettings.error)}\n`,
    );
  }
}
