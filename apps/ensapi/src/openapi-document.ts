import type { OpenAPIHono } from "@hono/zod-openapi";

import { openapiMeta } from "@/openapi-meta";

import app from "./app";

/**
 * Generates an OpenAPI 3.1 document from the real registered routes.
 */
export function generateOpenApi31Document(): ReturnType<OpenAPIHono["getOpenAPI31Document"]> {
  return app.getOpenAPI31Document(openapiMeta);
}
