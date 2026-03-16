import { z } from "zod/v4";

import type { ErrorResponse } from "./response";

/**
 * Schema for {@link ErrorResponse}.
 */
export const ErrorResponseSchema = z.object({
  message: z.string(),
  details: z.optional(z.unknown()),
});
