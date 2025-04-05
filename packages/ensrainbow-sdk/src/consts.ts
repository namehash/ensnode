export const DEFAULT_ENSRAINBOW_URL = "https://api.ensrainbow.io" as const;

export const StatusCode = {
  Success: "success",
  Error: "error",
} as const;

export const ErrorCode = {
  BadRequest: 400,
  NotFound: 404,
  ServerError: 500,
  // Network error codes
  TIMEOUT: 1000,
  NETWORK_OFFLINE: 1001,
  GENERAL_NETWORK_ERROR: 1099,
} as const;
