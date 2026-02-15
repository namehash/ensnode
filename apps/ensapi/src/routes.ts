/**
 * Lightweight route composition for OpenAPI spec generation.
 *
 * This module builds a minimal Hono app with only `describeRoute` metadata
 * attached to stub handlers. It imports only from `.routes.ts` files which
 * have zero config/env dependencies, making it safe to import in contexts
 * where the app config is not available (e.g. script-based spec generation).
 *
 * The runtime server (index.ts) does NOT use this module — it mounts the
 * real handler files directly. This module exists solely so that
 * `generateSpecs()` from `hono-openapi` can inspect the route metadata.
 */

import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { getAmIRealtimeRoute } from "./handlers/amirealtime-api.routes";
import {
  getReferrerDetailRoute,
  getReferrerLeaderboardRoute,
} from "./handlers/ensanalytics-api.routes";
import {
  getEditionConfigSetRoute,
  getReferralLeaderboardV1Route,
  getReferrerDetailV1Route,
} from "./handlers/ensanalytics-api-v1.routes";
import { getConfigRoute, getIndexingStatusRoute } from "./handlers/ensnode-api.routes";
import { getNameTokensRoute } from "./handlers/name-tokens-api.routes";
import {
  getRegistrarActionsByParentNodeRoute,
  getRegistrarActionsRoute,
} from "./handlers/registrar-actions-api.routes";
import {
  getResolvePrimaryNameRoute,
  getResolvePrimaryNamesRoute,
  getResolveRecordsRoute,
} from "./handlers/resolution-api.routes";

// Stub handler used for all routes — generateSpecs only reads describeRoute metadata
const stub = (c: any) => c.text("");

export function createRoutesForSpec() {
  const app = new Hono();

  // /api routes (ensnode-api)
  app.get("/api/config", describeRoute(getConfigRoute), stub);
  app.get("/api/indexing-status", describeRoute(getIndexingStatusRoute), stub);

  // /api/name-tokens routes
  app.get("/api/name-tokens", describeRoute(getNameTokensRoute), stub);

  // /api/registrar-actions routes
  app.get("/api/registrar-actions", describeRoute(getRegistrarActionsRoute), stub);
  app.get(
    "/api/registrar-actions/:parentNode",
    describeRoute(getRegistrarActionsByParentNodeRoute),
    stub,
  );

  // /api/resolve routes (resolution-api)
  app.get("/api/resolve/records/:name", describeRoute(getResolveRecordsRoute), stub);
  app.get(
    "/api/resolve/primary-name/:address/:chainId",
    describeRoute(getResolvePrimaryNameRoute),
    stub,
  );
  app.get("/api/resolve/primary-names/:address", describeRoute(getResolvePrimaryNamesRoute), stub);

  // /ensanalytics routes
  app.get("/ensanalytics/referrers", describeRoute(getReferrerLeaderboardRoute), stub);
  app.get("/ensanalytics/referrers/:referrer", describeRoute(getReferrerDetailRoute), stub);

  // /v1/ensanalytics routes
  app.get(
    "/v1/ensanalytics/referral-leaderboard",
    describeRoute(getReferralLeaderboardV1Route),
    stub,
  );
  app.get("/v1/ensanalytics/referrer/:referrer", describeRoute(getReferrerDetailV1Route), stub);
  app.get("/v1/ensanalytics/editions", describeRoute(getEditionConfigSetRoute), stub);

  // /amirealtime routes
  app.get("/amirealtime", describeRoute(getAmIRealtimeRoute), stub);

  return app;
}
