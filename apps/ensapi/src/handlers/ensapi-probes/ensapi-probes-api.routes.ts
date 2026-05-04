import { createRoute, z } from "@hono/zod-openapi";

const makeProbeRouteResponseSchemaOk = () =>
  z.object({
    responseCode: z.literal("ok"),
  });

const makeProbeRouteResponseSchemaError = () =>
  z.object({
    responseCode: z.literal("error"),
    message: z.string(),
  });

export const healthCheckRoute = createRoute({
  method: "get",
  path: "/health",
  operationId: "getHealthCheck",
  tags: ["Probes"],
  summary: "Health Check Endpoint",
  description: "Checks the health status of the ENSApi service",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: makeProbeRouteResponseSchemaOk(),
        },
      },
    },
    503: {
      description: "Service unavailable",
      content: {
        "application/json": {
          schema: makeProbeRouteResponseSchemaError(),
        },
      },
    },
  },
});

export const readinessCheckRoute = createRoute({
  method: "get",
  path: "/ready",
  operationId: "getReadinessCheck",
  tags: ["Probes"],
  summary: "Readiness Check Endpoint",
  description: "Checks the readiness status of the ENSApi service",
  responses: {
    200: {
      description: "Service is ready",
      content: {
        "application/json": {
          schema: makeProbeRouteResponseSchemaOk(),
        },
      },
    },
    503: {
      description: "Service unavailable",
      content: {
        "application/json": {
          schema: makeProbeRouteResponseSchemaError(),
        },
      },
    },
  },
});
