import { otel } from "@hono/otel";
import { Hono } from "hono";

import { sdk } from "@/lib/tracing/instrumentation";
import resolutionApi from "./resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

// Resolution API
app.route("/resolve", resolutionApi);

// start ENSNode API OpenTelemetry SDK
sdk.start();

// gracefully shut down the SDK on process interrupt/exit
const shutdownOpenTelemetry = () =>
  sdk.shutdown().catch((error) => console.error("Error terminating tracing", error));
process.on("SIGINT", shutdownOpenTelemetry);
process.on("SIGTERM", shutdownOpenTelemetry);

export default app;
