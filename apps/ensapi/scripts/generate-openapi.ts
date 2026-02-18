/**
 * Generates the OpenAPI specification JSON for ENSApi.
 *
 * This script can run without any environment variables or config because it
 * imports only from the lightweight `.routes.ts` description files via
 * `createRoutesForSpec()`, which have zero config dependencies.
 *
 * Usage:
 *   pnpm generate:openapi > openapi.json
 *   pnpm generate:openapi              # prints to stdout
 */

import { openapiDocumentation } from "@/openapi";
import { createRoutesForSpec } from "@/routes";

const app = createRoutesForSpec();
const spec = app.getOpenAPI31Document(openapiDocumentation);

process.stdout.write(JSON.stringify(spec, null, 2));
process.stdout.write("\n");
