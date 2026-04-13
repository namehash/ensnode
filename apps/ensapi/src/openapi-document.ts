import type { OpenAPIHono } from "@hono/zod-openapi";

import { openapiMeta } from "@/openapi-meta";

/**
 * Endpoints to exclude from the generated OpenAPI document.
 * TODO: remove /amirealtime once the legacy endpoint is deleted.
 */
const HIDE_OPENAPI_ENDPOINTS: string[] = ["/amirealtime"];

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
