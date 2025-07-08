import packageJson from "@/../package.json";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const exporter = new ConsoleSpanExporter();

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "ensindexer",
    [ATTR_SERVICE_VERSION]: packageJson.version,
  }),
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
