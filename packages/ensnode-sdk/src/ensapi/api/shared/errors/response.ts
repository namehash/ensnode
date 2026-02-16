import type { z } from "zod/v4";

import type { ErrorResponseSchema } from "./zod-schemas";

/**
 * API Error Response Type
 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
