import type { OpenAPIHono } from "@hono/zod-openapi";

import { openapiMeta } from "@/openapi-meta";

/**
 * Endpoints to exclude from the generated OpenAPI document.
 */
const HIDE_OPENAPI_ENDPOINTS: string[] = [
  // TODO: remove /amirealtime once the legacy endpoint is deleted.
  "/amirealtime",
  // TODO: remove all other endpoints from this list once the legacy endpoints are deleted.
  "/api/name-tokens",
  "/api/registrar-actions",
  "/api/registrar-actions/{parentNode}",
  "/v1/ensanalytics/referral-leaderboard",
  "/v1/ensanalytics/referrer/{referrer}",
  "/v1/ensanalytics/editions",
  "/v1/ensanalytics/accounting",
];

type OpenApiDocument = ReturnType<OpenAPIHono["getOpenAPI31Document"]>;

function removeHiddenEndpoints(doc: OpenApiDocument): OpenApiDocument {
  for (const path of HIDE_OPENAPI_ENDPOINTS) {
    delete doc.paths?.[path];
  }
  return doc;
}

/**
 * Generates an OpenAPI 3.1 document from the registered routes.
 *
 * Generation script and the runtime endpoint share the same function so that
 * the generated OpenAPI document is always in sync with the actual API.
 */
export function generateOpenApi31Document(app: OpenAPIHono<any>): OpenApiDocument {
  const doc = app.getOpenAPI31Document(openapiMeta);
  return removeHiddenEndpoints(doc);
}
