declare module "parse-prometheus-text-format" {
  export interface PrometheusMetric {
    name: string;
    help: string;
    type: string;
    metrics: Array<{
      value: string;
      labels?: Record<string, string>;
    }>;
  }

  export default function parsePrometheusTextFormat(text: string): Array<PrometheusMetric>;
}
