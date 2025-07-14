import packageJson from "@/../package.json";
import { ProtocolTraceExporter } from "@/api/lib/protocol-tracing";

import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// Something broken with OpenTelemetry? enable debug logging by uncommenting the following two lines:
// import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// always include the ProtocolTraceExporter
// NOTE: the SimpleSpanProcessor is mandatory, we want synchronous access to ended spans
const spanProcessors: SpanProcessor[] = [
  new SimpleSpanProcessor(ProtocolTraceExporter.singleton()),
];

// TODO: include this in production once OTel Collector is set up
// TODO: filter out protocol-tracing traces for our own instrumentation? they're redundant but
// it might be useful to refer to protocol-semantic steps for timings and such
if (process.env.NODE_ENV === "development") {
  spanProcessors.push(
    new BatchSpanProcessor(new OTLPTraceExporter(), {
      scheduledDelayMillis: process.env.NODE_ENV === "development" ? 1_000 : undefined,
    }),
  );
}

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "ensnode-api",
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  spanProcessors,
  // TODO: metrics, once OTel Collector is set up
  // metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
  // NOTE: avoiding auto-instrumentation for now as it adds complexity and can be quite noisy
  instrumentations: [],
});
