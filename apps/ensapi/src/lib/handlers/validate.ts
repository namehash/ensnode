import { SchemaError } from "@standard-schema/utils";
import type { ValidationTargets } from "hono";
import { validator } from "hono-openapi";
import { prettifyError, ZodError, type ZodType } from "zod/v4";

import { buildResultInvalidRequest } from "@ensnode/ensnode-sdk";

import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";

/**
 * Creates a Hono validation middleware.
 *
 * Wraps the Hono validator with custom error handling that uses standardized
 * response data model across the API.
 *
 * @param target - The validation target (param, query, json, etc.)
 * @param schema - The Zod schema to validate against
 * @returns Hono middleware that validates the specified target
 */
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  validator(target, schema, (result, c) => {
    // Respond with the invalid request result if validation failed.
    if (!result.success) {
      // Convert Standard Schema issues to ZodError for consistent formatting
      const schemaError = new SchemaError(result.error);
      const zodError = new ZodError(schemaError.issues as ZodError["issues"]);
      const errorMessage = prettifyError(zodError);

      return resultIntoHttpResponse(c, buildResultInvalidRequest(errorMessage));
    }
  });
