import { z } from "zod/v4";

import type { ErrorResponse } from "./response";

/**
 * Schema for {@link ErrorResponse}.
 */
export const makeErrorResponseSchema = () =>
  z.object({
    message: z.string().describe("A description of the error that occurred."),
    details: z.optional(z.unknown()).describe("Additional details about the error."),
  });
