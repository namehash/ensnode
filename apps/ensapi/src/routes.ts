/**
 * Lightweight route composition for OpenAPI spec generation.
 *
 * This module builds a minimal OpenAPIHono app with route definitions
 * registered via `app.openapi()` with stub handlers. It imports only
 * from `.routes.ts` files which have zero config/env dependencies,
 * making it safe to import in contexts where the app config is not
 * available (e.g. script-based spec generation).
 *
 * The runtime server (index.ts) does NOT use this module. It mounts
 * the real handler files directly. This module exists solely so that
 * `app.getOpenAPI31Document()` can inspect the route metadata.
 */

import { OpenAPIHono } from "@hono/zod-openapi";

import {
  basePath as amIRealtimeBasePath,
  routes as amIRealtimeRoutes,
} from "./handlers/amirealtime-api.routes";
import {
  basePath as ensanalyticsBasePath,
  routes as ensanalyticsRoutes,
} from "./handlers/ensanalytics-api.routes";
import {
  basePath as ensanalyticsV1BasePath,
  routes as ensanalyticsV1Routes,
} from "./handlers/ensanalytics-api-v1.routes";
import {
  basePath as ensnodeBasePath,
  routes as ensnodeRoutes,
} from "./handlers/ensnode-api.routes";
import {
  basePath as nameTokensBasePath,
  routes as nameTokensRoutes,
} from "./handlers/name-tokens-api.routes";
import {
  basePath as registrarActionsBasePath,
  routes as registrarActionsRoutes,
} from "./handlers/registrar-actions-api.routes";
import {
  basePath as resolutionBasePath,
  routes as resolutionRoutes,
} from "./handlers/resolution-api.routes";

type RouteGroup = {
  basePath: string;
  routes: readonly { method: string; path: string }[];
};

const routeGroups: RouteGroup[] = [
  { basePath: ensnodeBasePath, routes: ensnodeRoutes },
  { basePath: nameTokensBasePath, routes: nameTokensRoutes },
  { basePath: registrarActionsBasePath, routes: registrarActionsRoutes },
  { basePath: resolutionBasePath, routes: resolutionRoutes },
  { basePath: ensanalyticsBasePath, routes: ensanalyticsRoutes },
  { basePath: ensanalyticsV1BasePath, routes: ensanalyticsV1Routes },
  { basePath: amIRealtimeBasePath, routes: amIRealtimeRoutes },
];

// Stub handler for spec generation - never actually called
const stub = (c: any) => c.text("");

export function createRoutesForSpec() {
  const app = new OpenAPIHono();

  for (const group of routeGroups) {
    for (const route of group.routes) {
      const fullPath = route.path === "/" ? group.basePath : `${group.basePath}${route.path}`;
      // Override path to include the basePath prefix
      app.openapi({ ...route, path: fullPath } as any, stub);
    }
  }

  return app;
}
