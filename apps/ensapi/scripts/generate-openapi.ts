/**
 * Generate OpenAPI specification at build time.
 *
 * This script builds a Hono app using the shared route definitions
 * and extracts the OpenAPI spec without needing runtime config.
 *
 * Usage: pnpm run generate:openapi
 */

import packageJson from "../package.json" with { type: "json" };

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { generateSpecs } from "hono-openapi";

import { amIRealtimeRoute } from "../src/routes/amirealtime-api.routes";
import {
  referrerDetailRoute,
  referrerLeaderboardRoute,
} from "../src/routes/ensanalytics-api.routes";
// Import shared route definitions - these don't require runtime config
import { configRoute, indexingStatusRoute } from "../src/routes/ensnode-api.routes";
import { nameTokensRoute } from "../src/routes/name-tokens-api.routes";
import {
  registrarActionsByParentNodeRoute,
  registrarActionsRoute,
} from "../src/routes/registrar-actions-api.routes";
import {
  resolvePrimaryNameRoute,
  resolvePrimaryNamesRoute,
  resolveRecordsRoute,
} from "../src/routes/resolution-api.routes";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build an app with the same route structure as the main app
const app = new Hono();

// /api routes
app.get("/api/config", configRoute, (c) => c.json({}));
app.get("/api/indexing-status", indexingStatusRoute, (c) => c.json({}));

// /api/resolve routes
app.get("/api/resolve/records/:name", resolveRecordsRoute, (c) => c.json({}));
app.get("/api/resolve/primary-name/:address/:chainId", resolvePrimaryNameRoute, (c) => c.json({}));
app.get("/api/resolve/primary-names/:address", resolvePrimaryNamesRoute, (c) => c.json({}));

// /api/name-tokens routes
app.get("/api/name-tokens", nameTokensRoute, (c) => c.json({}));

// /api/registrar-actions routes
app.get("/api/registrar-actions", registrarActionsRoute, (c) => c.json({}));
app.get("/api/registrar-actions/:parentNode", registrarActionsByParentNodeRoute, (c) => c.json({}));

// /ensanalytics routes
app.get("/ensanalytics/referrers", referrerLeaderboardRoute, (c) => c.json({}));
app.get("/ensanalytics/referrers/:referrer", referrerDetailRoute, (c) => c.json({}));

// /amirealtime routes
app.get("/amirealtime", amIRealtimeRoute, (c) => c.json({}));

// Generate OpenAPI spec
const spec = await generateSpecs(app, {
  documentation: {
    info: {
      title: "ENSNode API",
      version: packageJson.version,
      description:
        "APIs for ENS resolution, navigating the ENS nameforest, and metadata about an ENSNode",
    },
    servers: [
      {
        url: "https://api.alpha.ensnode.io",
        description: "Production",
      },
    ],
    tags: [
      {
        name: "Resolution",
        description: "APIs for resolving ENS names and addresses",
      },
      {
        name: "Meta",
        description: "APIs for indexing status, configuration, and realtime monitoring",
      },
      {
        name: "Explore",
        description:
          "APIs for exploring the indexed state of ENS, including name tokens and registrar actions",
      },
      {
        name: "ENSAwards",
        description: "APIs for ENSAwards functionality, including referrer data",
      },
    ],
  },
});

// Write the spec to file
const outputPath = resolve(__dirname, "../openapi.json");
writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`OpenAPI spec written to ${outputPath}`);
