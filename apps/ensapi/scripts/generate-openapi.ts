/**
 * Generates the OpenAPI specification JSON for ENSApi.
 *
 * This script can run without any environment variables or config because it
 * imports only from the lightweight `.routes.ts` description files via
 * `createRoutesForSpec()`, which have zero config dependencies.
 *
 * The version is resolved from (in order of precedence):
 *   1. OPENAPI_VERSION_OVERRIDE env var
 *   2. package.json version
 *   3. openapiDocumentation.info.version (placeholder fallback)
 *
 * Usage:
 *   pnpm generate:openapi > openapi.json
 *   pnpm generate:openapi              # prints to stdout
 *   OPENAPI_VERSION_OVERRIDE=1.2.3 pnpm generate:openapi
 */

import packageJson from "@/../package.json" with { type: "json" };

import { openapiDocumentation } from "@/openapi";
import { createRoutesForSpec } from "@/openapi-routes";

const version =
  process.env.OPENAPI_VERSION_OVERRIDE || packageJson.version || openapiDocumentation.info.version;

const app = createRoutesForSpec();
const spec = app.getOpenAPI31Document({
  ...openapiDocumentation,
  info: {
    ...openapiDocumentation.info,
    version,
  },
});

process.stdout.write(JSON.stringify(spec, null, 2));
process.stdout.write("\n");
