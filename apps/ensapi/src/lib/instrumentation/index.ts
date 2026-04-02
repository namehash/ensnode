import packageJson from "@/../package.json";

import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { AlwaysOffSampler, BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// instrumentation is enabled if OTEL_EXPORTER_OTLP_ENDPOINT is defined
const enabled = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// something broken with OpenTelemetry? enable debug logging with OTEL_DEBUG=anything
const debug = !!process.env.OTEL_DEBUG;

if (debug) diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: packageJson.name,
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  // if enabled, default sampler, otherwise AlwaysOffSampler avoids span allocation entirely
  sampler: enabled ? undefined : new AlwaysOffSampler(),
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter(), {
      scheduledDelayMillis: process.env.NODE_ENV === "development" ? 1_000 : undefined,
    }),
  ],
  // NOTE: avoiding auto-instrumentation for now as it adds complexity and can be quite noisy
  instrumentations: [],
});
