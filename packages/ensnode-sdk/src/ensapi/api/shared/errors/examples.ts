import type { ErrorResponse } from "./response";

/**
 * Example value for {@link ErrorResponse} representing a 400 Bad Request, for use in OpenAPI documentation.
 */
export const errorResponseBadRequestExample = {
  message: "endTimestamp must be greater than or equal to beginTimestamp",
} satisfies ErrorResponse;
