import type { z } from "zod/v4";

import type { makeErrorResponseSchema } from "./zod-schemas";

/**
 * API Error Response Type
 */
export type ErrorResponse = z.infer<ReturnType<typeof makeErrorResponseSchema>>;
