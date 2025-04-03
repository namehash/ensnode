import parsePrometheusTextFormat, { type PrometheusMetric } from "parse-prometheus-text-format";
// Ensures local declaration file is available to downstream consumers
import "@/types/parse-prometheus-text-format";

interface ParsedPrometheusMetric extends Omit<PrometheusMetric, "metrics"> {
  metrics: Array<{
    value: number;
    labels?: Record<string, string>;
  }>;
}

/**
 * Converts Prometheus text format to JSON format compatible with prom2json
 * @param text Raw Prometheus metric text
 * @returns Array of metrics in prom2json compatible format
 * @example
 * ```ts
 * const metrics = parsePrometheusText(`
 * # HELP ponder_version_info Ponder version information
 * # TYPE ponder_version_info gauge
 * ponder_version_info{version="0.9.18",major="0",minor="9",patch="18"} 1
 * `);
 * // Returns:
 * // [{
 * //   name: "ponder_version_info",
 * //   help: "Ponder version information",
 * //   type: "gauge",
 * //   metrics: [{
 * //     value: 1,
 * //     labels: { version: "0.9.18", major: "0", minor: "9", patch: "18" }
 * //   }]
 * // }]
 * ```
 */
export function parsePrometheusText(text: string): Array<ParsedPrometheusMetric> {
  return parsePrometheusTextFormat(text).map((metric) => ({
    name: metric.name,
    help: metric.help || "",
    type: metric.type.toLowerCase(),
    metrics: metric.metrics.map((m) => ({
      value: Number(m.value),
      ...(m.labels && Object.keys(m.labels).length > 0 ? { labels: m.labels } : {}),
    })),
  }));
}

export class PrometheusMetrics {
  private constructor(private readonly metrics: Array<ParsedPrometheusMetric>) {}

  static parse(maybePrometheusMetricsText: string): PrometheusMetrics {
    return new PrometheusMetrics(parsePrometheusText(maybePrometheusMetricsText));
  }

  /**
   * Gets all metrics of a specific name
   * @param name Metric name
   * @returns Array of metrics or undefined if not found
   * @example
   * ```ts
   * const metrics = parser.get('ponder_historical_total_indexing_seconds');
   * // Returns: [
   * //   { value: 251224935, labels: { network: "1" } },
   * //   { value: 251224935, labels: { network: "8453" } }
   * // ]
   * ```
   */
  get(name: string): Array<{ value: number; labels?: Record<string, string> }> | undefined {
    const metric = this.metrics.find((m) => m.name === name);
    return metric?.metrics;
  }

  /**
   * Gets a single metric value, optionally filtered by labels
   * @param name Metric name
   * @param labelFilter Optional label key-value pairs to match
   * @returns Metric value or undefined if not found
   * @example
   * ```ts
   * // Get simple value
   * parser.getValue('ponder_historical_start_timestamp_seconds') // Returns: 1740391265
   *
   * // Get value with label filter
   * parser.getValue('ponder_historical_total_indexing_seconds', { network: '1' }) // Returns: 251224935
   * ```
   */
  getValue(name: string, labelFilter?: Record<string, string>): number | undefined {
    const metrics = this.get(name);

    if (!metrics || metrics.length === 0) {
      return undefined;
    }

    if (!labelFilter) {
      return metrics[0]?.value;
    }

    const metric = metrics.find(
      (m) => m.labels && Object.entries(labelFilter).every(([k, v]) => m.labels?.[k] === v),
    );

    return metric?.value;
  }

  /**
   * Gets a label value from a metric
   * @param name Metric name
   * @param label Label name to retrieve
   * @returns Label value or undefined if not found
   * @example
   * ```ts
   * parser.getLabel('ponder_version_info', 'version') // Returns: "0.9.18"
   * parser.getLabel('ponder_settings_info', 'ordering') // Returns: "omnichain"
   * ```
   */
  getLabel(name: string, label: string): string | undefined {
    return this.getLabels(name, label)[0];
  }

  /**
   * Gets all unique label values for a metric
   * @param name Metric name
   * @param label Label name to retrieve
   * @returns Array of unique label values
   * @example
   * ```ts
   * // Get all network IDs
   * parser.getLabels('ponder_historical_total_indexing_seconds', 'network')
   * // Returns: ['1', '8453']
   * ```
   */
  getLabels(name: string, label: string): string[] {
    const metrics = this.get(name);

    if (!metrics) return [];

    return [
      ...new Set(metrics.map((m) => m.labels?.[label]).filter((v): v is string => v !== undefined)),
    ];
  }

  /**
   * Gets help text for a metric
   * @param name Metric name
   * @returns Help text or undefined if not found
   * @example
   * ```ts
   * parser.getHelp('ponder_historical_start_timestamp_seconds')
   * // Returns: "Timestamp at which historical indexing started"
   * ```
   */
  getHelp(name: string): string | undefined {
    return this.metrics.find((m) => m.name === name)?.help;
  }

  /**
   * Gets metric type
   * @param name Metric name
   * @returns Metric type or undefined if not found
   * @example
   * ```ts
   * parser.getType('ponder_version_info') // Returns: "gauge"
   * parser.getType('ponder_postgres_query_total') // Returns: "counter"
   * ```
   */
  getType(name: string): string | undefined {
    return this.metrics.find((m) => m.name === name)?.type;
  }

  /**
   * Gets all metric names
   * @returns Array of metric names
   * @example
   * ```ts
   * parser.getMetricNames()
   * // Returns: [
   * //   'ponder_version_info',
   * //   'ponder_settings_info',
   * //   'ponder_historical_start_timestamp_seconds',
   * //   'ponder_historical_total_indexing_seconds'
   * // ]
   * ```
   */
  getMetricNames(): string[] {
    return this.metrics.map((m) => m.name);
  }
}
