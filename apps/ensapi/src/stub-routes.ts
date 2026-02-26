import { OpenAPIHono } from "@hono/zod-openapi";

import * as amIRealtimeRoutes from "./handlers/amirealtime-api.routes";
import * as ensnodeRoutes from "./handlers/ensnode-api.routes";
import * as resolutionRoutes from "./handlers/resolution-api.routes";

/**
 * Creates an OpenAPIHono app with all route definitions registered using stub handlers.
 * This allows generating the OpenAPI spec without importing any handler code that
 * depends on config/env vars.
 */
export function createStubRoutesForSpec() {
  const app = new OpenAPIHono();

  const routeGroups = [amIRealtimeRoutes, ensnodeRoutes, resolutionRoutes];

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
