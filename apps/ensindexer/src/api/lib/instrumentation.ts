import packageJson from "@/../package.json";
import { ProtocolTraceExporter } from "@/api/lib/protocol-tracing";

import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// Something broken with OpenTelemetry? enable debug logging with OTEL_DEBUG=anything
if (process.env.OTEL_DEBUG) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
}

const spanProcessors: SpanProcessor[] = [
  // NOTE: the SimpleSpanProcessor is mandatory, we want synchronous access to ended spans
  new SimpleSpanProcessor(ProtocolTraceExporter.singleton()),
];

// only export spans to OTel Collector iff OTEL_EXPORTER_OTLP_ENDPOINT is defined
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
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
  // NOTE: avoiding auto-instrumentation for now as it adds complexity and can be quite noisy
  instrumentations: [],
});
