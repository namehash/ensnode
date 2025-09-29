import { errorResponse } from "@/api/lib/handlers/error-response";
import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod/v4";

export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    // if validation failed, return our custom-formatted ErrorResponse instead of default
    if (!result.success) return errorResponse(c, result.error);
  });
