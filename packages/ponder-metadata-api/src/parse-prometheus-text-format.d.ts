declare module "parse-prometheus-text-format" {
  interface PrometheusMetric {
    name: string;
    help: string;
    type: string;
    metrics: Array<{
      value: number;
      labels: Record<string, string>;
    }>;
  }

  function parsePrometheusTextFormat(text: string): PrometheusMetric[];

  export default parsePrometheusTextFormat;
}
