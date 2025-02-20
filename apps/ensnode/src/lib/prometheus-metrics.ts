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
  private metrics: Map<string, MetricValue | HistogramValue>;
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
   * Gets raw metric value including all metadata
   * @param name Metric name
   * @returns Full metric object or undefined if not found
   * @example
   * ```ts
   * const metric = metrics.get('http_requests_total');
   * // Returns: { value: 1234, labels: { method: "GET" }, type: "counter" }
   * ```
   */
  get(name: string): MetricValue | HistogramValue | undefined {
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
    const metric = this.metrics.get(name);
    if (!metric) return undefined;

    if (!labelFilter) return metric.value;

    if (metric.labels) {
      const matches = Object.entries(labelFilter).every(([k, v]) => metric.labels?.[k] === v);
      return matches ? metric.value : undefined;
    }

    return undefined;
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
    const metric = this.metrics.get(name);
    return metric?.labels?.[label];
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
  getHistogramStats(name: string): { avg: number; p95: number; max: number } | undefined {
    const metric = this.metrics.get(name) as HistogramValue;
    if (!metric || metric.type !== "histogram" || metric.count === 0) return undefined;

    const bucketEntries = Object.entries(metric.buckets);
    if (bucketEntries.length === 0) return undefined;

    const buckets = bucketEntries
      .map(([le, count]) => ({
        le: le === "+Inf" ? Infinity : parseFloat(le),
        count,
      }))
      .sort((a, b) => a.le - b.le);

    const lastBucket = buckets[buckets.length - 1];
    if (!lastBucket) return undefined;

    return {
      avg: metric.sum / metric.count,
      p95: this.calculatePercentile(buckets, lastBucket.count, 0.95),
      max: lastBucket.le,
    };
  }

  /**
   * Calculates percentile value from histogram buckets
   * @param buckets Sorted bucket array with le and count
   * @param totalCount Total count across all buckets
   * @param p Percentile value (0-1)
   * @returns Calculated percentile value
   * @private
   */
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

    // If no bucket meets the target, return the highest bucket's upper bound
    return buckets[buckets.length - 1]?.le ?? 0;
  }

  /**
   * Processes a single metric line and updates the corresponding metric value
   * @param name Metric name
   * @param labelString Optional label string in Prometheus format
   * @param value Metric value
   * @private
   */
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
      this.metrics.set(name, {
        value,
        labels: this.parseLabels(labelString),
        help: this.help.get(name),
        type: this.types.get(name),
      });
    }
  }

  /**
   * Parses Prometheus label string into an object
   * @param labelString Label string in format 'label1="value1",label2="value2"'
   * @returns Object with label key-value pairs or undefined if no valid labels
   * @private
   * @example
   * ```ts
   * parseLabels('method="GET",status="200"')
   * // Returns: { method: "GET", status: "200" }
   * ```
   */
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

  /**
   * Gets or creates a histogram metric
   * @param name Metric name
   * @returns Histogram metric object
   * @private
   */
  private getOrCreateHistogram(name: string): HistogramValue {
    let metric = this.metrics.get(name) as HistogramValue;
    if (!metric) {
      metric = {
        value: 0,
        buckets: {},
        sum: 0,
        count: 0,
        help: this.help.get(name),
        type: "histogram",
      };
      this.metrics.set(name, metric);
    }
    return metric;
  }

  /**
   * Type guard for metric types
   * @param type String to check
   * @returns True if valid metric type
   * @private
   */
  private isValidMetricType(type: string): type is MetricType {
    return ["counter", "gauge", "histogram"].includes(type);
  }
}
