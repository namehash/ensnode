import type { resolver as resolveOpenApiSchema } from "hono-openapi";

export type OpenApiSchemaResolver = ReturnType<typeof resolveOpenApiSchema>;

/**
 * Represents an OpenAPI route response.
 */
export interface OpenApiRouteResponse {
  description: string;
  content: {
    "application/json": {
      schema: OpenApiSchemaResolver;
      examples: Record<
        string,
        {
          summary: string;
          value: object;
          description?: string;
        }
      >;
    };
  };
}
