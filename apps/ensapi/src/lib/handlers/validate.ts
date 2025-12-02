import { validator } from "hono-openapi";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod/v4";

import { errorResponse } from "./error-response";

/**
 * Creates a Hono validation middleware with custom error formatting.
 *
 * Wraps the Hono zValidator with custom error handling that uses the
 * errorResponse function for consistent error formatting across the API.
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
    // if validation failed, return our custom-formatted ErrorResponse instead of default
    if (!result.success) return errorResponse(c, result.error);
  });
