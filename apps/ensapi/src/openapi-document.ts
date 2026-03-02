import { OpenAPIHono } from "@hono/zod-openapi";

import { openapiMeta } from "@/openapi-meta";

import * as amIRealtimeRoutes from "./handlers/amirealtime-api.routes";
import * as ensanalyticsRoutes from "./handlers/ensanalytics-api.routes";
import * as ensanalyticsV1Routes from "./handlers/ensanalytics-api-v1.routes";
import * as ensnodeRoutes from "./handlers/ensnode-api.routes";
import * as nameTokensRoutes from "./handlers/name-tokens-api.routes";
import * as registrarActionsRoutes from "./handlers/registrar-actions-api.routes";
import * as resolutionRoutes from "./handlers/resolution-api.routes";

const routeGroups = [
  amIRealtimeRoutes,
  ensnodeRoutes,
  ensanalyticsV1Routes,
  ensanalyticsRoutes,
  nameTokensRoutes,
  registrarActionsRoutes,
  resolutionRoutes,
];

/**
 * Creates an OpenAPIHono app with all route definitions registered using stub
 * handlers. This allows generating the OpenAPI spec without importing any
 * handler code that depends on config/env vars.
 */
function createStubRoutesForSpec() {
  const app = new OpenAPIHono();

  for (const group of routeGroups) {
    for (const route of group.routes) {
      const path = route.path === "/" ? group.basePath : `${group.basePath}${route.path}`;
      app.openapi(
        { ...route, path },
        // stub handler — never called, only needed for route registration
        (c) => c.json({}),
      );
    }
  }

  return app;
}

/**
 * Generates an OpenAPI 3.1 document from stub route definitions.
 * Accepts optional additional servers (e.g. a localhost entry derived from
 * runtime config) so that the core generation has no runtime dependencies.
 */
export function generateOpenApi31Document(
  additionalServers: { url: string; description: string }[] = [],
): ReturnType<OpenAPIHono["getOpenAPI31Document"]> {
  return createStubRoutesForSpec().getOpenAPI31Document({
    ...openapiMeta,
    servers: [...openapiMeta.servers, ...additionalServers],
  });
}
