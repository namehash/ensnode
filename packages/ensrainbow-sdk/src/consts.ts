export const StatusCode = {
  Success: "success",
  Error: "error",
} as const;

export const ErrorCode = {
  BadRequest: 400,
  NotFound: 404,
  ServerError: 500,
} as const;
