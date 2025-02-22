type MetricType = "counter" | "gauge" | "histogram";

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  help?: string;
  type?: MetricType;
}

interface HistogramValue extends MetricValue {
  buckets: Record<string, number>;
  sum: number;
  count: number;
}

export class PrometheusMetrics {
  private metrics: Map<string, (MetricValue | HistogramValue)[]>;
  private help: Map<string, string>;
  private types: Map<string, MetricType>;

  constructor() {
    this.metrics = new Map();
    this.help = new Map();
    this.types = new Map();
  }

  /**
   * Parses Prometheus metric text format and populates the metrics map
   * @param text Raw Prometheus metric text
   * @example
   * ```ts
   * const metrics = new PrometheusMetrics();
   * metrics.parseText(`
   * # HELP http_requests_total Total number of HTTP requests
   * # TYPE http_requests_total counter
   * http_requests_total{method="GET"} 1234
   * `);
   * ```
   */
  parseText(text: string): void {
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      if (line.startsWith("# HELP")) {
        const [, name, ...helpParts] = line.substring(7).trim().split(" ");
        if (name) this.help.set(name, helpParts.join(" "));
        continue;
      }

      if (line.startsWith("# TYPE")) {
        const [, name, type] = line.substring(7).trim().split(" ");
        if (name && type && this.isValidMetricType(type)) {
          this.types.set(name, type);
        }
        continue;
      }

      if (line.startsWith("#")) continue;

      const match = line.match(
        /^([a-zA-Z_:][a-zA-Z0-9_:]*?)({(.+?)})??\s+(-?\d+\.?\d*(?:e[-+]\d+)?)\s*$/,
      );
      if (!match) continue;

      const [, name, , labelString, value] = match;
      if (!name || !value) continue;

      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) continue;

      this.processMetric(name, labelString, parsedValue);
    }
  }

  /**
   * Gets raw metric values including all metadata
   * @param name Metric name
   * @returns Array of metric objects or undefined if not found
   * @example
   * ```ts
   * const metrics = metrics.get('http_requests_total');
   * // Returns: [{ value: 1234, labels: { method: "GET" }, type: "counter" }]
   * ```
   */
  get(name: string): (MetricValue | HistogramValue)[] | undefined {
    return this.metrics.get(name);
  }

  /**
   * Gets numeric value of a metric, optionally filtered by labels
   * @param name Metric name
   * @param labelFilter Optional label key-value pairs to match
   * @returns Metric value or undefined if not found
   * @example
   * ```ts
   * // Get simple value
   * metrics.getValue('http_requests_total') // Returns: 1234
   *
   * // Get value with label filter
   * metrics.getValue('http_requests_total', { method: 'GET' }) // Returns: 1234
   * ```
   */
  getValue(name: string, labelFilter?: Record<string, string>): number | undefined {
    const metrics = this.metrics.get(name);
    if (!metrics?.length) return undefined;

    // If no label filter, return first metric value
    if (!labelFilter || Object.keys(labelFilter).length === 0) {
      const firstMetric = metrics[0];
      return firstMetric?.value;
    }

    // Find metric matching all label criteria
    const matchingMetric = metrics.find((metric) => {
      if (typeof metric.labels === "object") {
        return Object.entries(labelFilter).every(([k, v]) => metric.labels?.[k] === v);
      }
      return false;
    });

    return matchingMetric?.value;
  }

  /**
   * Gets a label value from a metric
   * @param name Metric name
   * @param label Label name to retrieve
   * @returns Label value or undefined if not found
   * @example
   * ```ts
   * // Get Ponder version
   * metrics.getLabel('ponder_version_info', 'version') // Returns: "0.9.18"
   *
   * // Get settings value
   * metrics.getLabel('ponder_settings_info', 'command') // Returns: "dev"
   * ```
   */
  getLabel(name: string, label: string): string | undefined {
    const metrics = this.metrics.get(name);
    if (!metrics?.length) return undefined;
    return metrics[0]?.labels?.[label];
  }

  /**
   * Gets all metrics matching a specific name and returns their label values
   * @param name Metric name
   * @param label Label name to retrieve
   * @returns Array of label values or empty array if none found
   * @example
   * ```ts
   * // Get all network IDs
   * metrics.getLabels('ponder_historical_total_blocks', 'network')
   * // Returns: ['1', '8453']
   * ```
   */
  getLabels(name: string, label: string): string[] {
    const metrics = this.metrics.get(name);
    if (!metrics?.length) return [];

    return metrics
      .map((metric) => metric.labels?.[label])
      .filter((value): value is string => value !== undefined);
  }

  /**
   * Calculates statistics for histogram metrics
   * @param name Histogram metric name
   * @returns Object with avg, p95, and max values or undefined if invalid
   * @example
   * ```ts
   * const stats = metrics.getHistogramStats('http_request_duration_ms');
   * // Returns: { avg: 123.45, p95: 200, max: 500 }
   * ```
   */
  getHistogramStats(
    name: string,
    labelFilter?: Record<string, string>,
  ): { avg: number; p95: number; max: number } | undefined {
    // Find matching metrics with the given labels
    const baseName = name.replace(/_bucket$/, "");
    const metrics = this.metrics.get(`${baseName}_bucket`);
    if (!metrics?.length) return undefined;

    // Filter metrics by labels
    const matchingMetrics = metrics.filter((metric) => {
      if (!metric.labels || !labelFilter) return true;
      return Object.entries(labelFilter).every(([k, v]) => metric.labels?.[k] === v);
    });

    if (!matchingMetrics.length) return undefined;

    // Get sum and count with matching labels
    const sum = this.getValue(`${baseName}_sum`, labelFilter) ?? 0;
    const count = this.getValue(`${baseName}_count`, labelFilter) ?? 0;

    if (count === 0) return undefined;

    // Collect buckets with matching labels
    const buckets = matchingMetrics
      .map((metric) => ({
        le: metric.labels?.le === "+Inf" ? Infinity : parseFloat(metric.labels?.le ?? "0"),
        count: metric.value,
      }))
      .sort((a, b) => a.le - b.le);

    if (buckets.length === 0) return undefined;

    return {
      avg: sum / count,
      p95: this.calculatePercentile(buckets, count, 0.95),
      max: buckets[buckets.length - 1]?.le ?? 0,
    };
  }

  private calculatePercentile(
    buckets: Array<{ le: number; count: number }>,
    totalCount: number,
    p: number,
  ): number {
    if (buckets.length === 0 || totalCount === 0) return 0;

    const target = p * totalCount;
    for (const bucket of buckets) {
      if (bucket.count >= target) {
        return bucket.le;
      }
    }

    return buckets[buckets.length - 1]?.le ?? 0;
  }

  private processMetric(name: string, labelString: string | undefined, value: number): void {
    const getBaseName = (name: string, suffix: string): string => {
      const parts = name.split(suffix);
      return parts[0] || name;
    };

    if (name.includes("_bucket")) {
      const baseName = getBaseName(name, "_bucket");
      const metric = this.getOrCreateHistogram(baseName);
      const labels = this.parseLabels(labelString);
      const le = labels?.le;
      if (le) metric.buckets[le] = value;
    } else if (name.includes("_sum")) {
      const baseName = getBaseName(name, "_sum");
      const metric = this.getOrCreateHistogram(baseName);
      metric.sum = value;
    } else if (name.includes("_count")) {
      const baseName = getBaseName(name, "_count");
      const metric = this.getOrCreateHistogram(baseName);
      metric.count = value;
    } else {
      const newMetric: MetricValue = {
        value,
        labels: this.parseLabels(labelString),
        help: this.help.get(name),
        type: this.types.get(name),
      };

      const existing = this.metrics.get(name) || [];
      this.metrics.set(name, [...existing, newMetric]);
    }
  }

  private getOrCreateHistogram(name: string): HistogramValue {
    const metrics = this.metrics.get(name) || [];
    let metric = metrics[0] as HistogramValue;

    if (!metric) {
      metric = {
        value: 0,
        buckets: {},
        sum: 0,
        count: 0,
        help: this.help.get(name),
        type: "histogram",
      };
      this.metrics.set(name, [metric]);
    }

    return metric;
  }

  private parseLabels(labelString?: string): Record<string, string> | undefined {
    if (!labelString) return undefined;

    const labels: Record<string, string> = {};
    const pairs = labelString.split(",");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        labels[key.trim()] = value.trim().replace(/^"(.*)"$/, "$1");
      }
    }

    return Object.keys(labels).length > 0 ? labels : undefined;
  }

  private isValidMetricType(type: string): type is MetricType {
    return ["counter", "gauge", "histogram"].includes(type);
  }
}
