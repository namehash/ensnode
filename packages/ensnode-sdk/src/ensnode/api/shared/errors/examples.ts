import type { ErrorResponse } from "./response";

/**
 * Example value for {@link ErrorResponse} representing a 400 Bad Request, for use in OpenAPI documentation.
 */
export const errorResponseBadRequestExample = {
  message: "Invalid Input",
} satisfies ErrorResponse;

/**
 * Example value for {@link ErrorResponse} representing a 400 Bad Request for an invalid ENS name,
 * for use in OpenAPI documentation.
 */
export const errorResponseInvalidNameExample = {
  message: "Invalid Input",
  details: {
    errors: [],
    properties: {
      name: { errors: ["Must be normalized, see https://docs.ens.domains/resolution/names/"] },
    },
  },
} satisfies ErrorResponse;

/**
 * Example value for {@link ErrorResponse} representing a 400 Bad Request for an invalid address,
 * for use in OpenAPI documentation.
 */
export const errorResponseInvalidAddressExample = {
  message: "Invalid Input",
  details: {
    errors: [],
    properties: { address: { errors: ["EVM address must be a valid EVM address"] } },
  },
} satisfies ErrorResponse;

/**
 * Example value for {@link ErrorResponse} representing a 500 Internal Server Error, for use in OpenAPI documentation.
 */
export const errorResponseInternalServerErrorExample = {
  message: "Internal Server Error",
} satisfies ErrorResponse;
