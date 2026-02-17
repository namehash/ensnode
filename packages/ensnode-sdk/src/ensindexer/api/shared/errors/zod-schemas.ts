import { z } from "zod/v4";

// biome-ignore lint/correctness/noUnusedImports: ErrorResponse is used in JSDoc @link
import type { ErrorResponse } from "./response";

/**
 * Schema for {@link ErrorResponse}.
 */
export const ErrorResponseSchema = z.object({
  message: z.string(),
  details: z.optional(z.unknown()),
});
