import packageJson from "@/../package.json";

import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "ensnode-api",
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter(), {
      scheduledDelayMillis: process.env.NODE_ENV === "development" ? 1_000 : undefined,
    }),
  ],
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
  // NOTE: avoiding auto-instrumentation for now as it adds complexity and can be quite noisy
  instrumentations: [],
});

// import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
