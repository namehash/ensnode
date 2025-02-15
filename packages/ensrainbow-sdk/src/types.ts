import { ErrorCode, StatusCode } from "./consts";

export type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface HealthResponse {
  status: "ok";
}

export interface BaseHealResponse<Status extends StatusCode, Error extends ErrorCode> {
  status: Status;
  label?: string | never;
  error?: string | never;
  errorCode?: Error | never;
}

export interface HealSuccess extends BaseHealResponse<typeof StatusCode.Success, never> {
  status: typeof StatusCode.Success;
  label: string;
  error?: never;
  errorCode?: never;
}

export interface HealNotFoundError
  extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.NotFound> {
  status: typeof StatusCode.Error;
  label?: never;
  error: string;
  errorCode: typeof ErrorCode.NotFound;
}

export interface HealServerError
  extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.ServerError> {
  status: typeof StatusCode.Error;
  label?: never;
  error: string;
  errorCode: typeof ErrorCode.ServerError;
}

export interface HealBadRequestError
  extends BaseHealResponse<typeof StatusCode.Error, typeof ErrorCode.BadRequest> {
  status: typeof StatusCode.Error;
  label?: never;
  error: string;
  errorCode: typeof ErrorCode.BadRequest;
}

export type HealResponse = HealSuccess | HealNotFoundError | HealServerError | HealBadRequestError;
export type HealError = Exclude<HealResponse, HealSuccess>;

/**
 * Server errors should not be cached.
 */
export type CacheableHealResponse = Exclude<HealResponse, HealServerError>;

/**
 * Determine if a heal response is an error.
 *
 * @param response the heal response to check
 * @returns true if the response is an error, false otherwise
 */
export const isHealError = (response: HealResponse): response is HealError => {
  return response.status === StatusCode.Error;
};

/**
 * Determine if a heal response is cacheable.
 *
 * Server errors at not cachable and should be retried.
 *
 * @param response the heal response to check
 * @returns true if the response is cacheable, false otherwise
 */
export const isCacheableHealResponse = (
  response: HealResponse,
): response is CacheableHealResponse => {
  return response.status === StatusCode.Success || response.errorCode !== ErrorCode.ServerError;
};

export interface BaseCountResponse<Status extends StatusCode, Error extends ErrorCode> {
  status: Status;
  count?: number | undefined;
  timestamp?: string | undefined;
  error?: string | undefined;
  errorCode?: Error | undefined;
}

export interface CountSuccess extends BaseCountResponse<typeof StatusCode.Success, never> {
  status: typeof StatusCode.Success;
  /** The total count of labels that can be healed by the ENSRainbow instance. Always a non-negative integer. */
  count: number;
  timestamp: string;
  error?: never;
  errorCode?: never;
}

export interface CountServerError
  extends BaseCountResponse<typeof StatusCode.Error, typeof ErrorCode.ServerError> {
  status: typeof StatusCode.Error;
  count?: never;
  timestamp?: never;
  error: string;
  errorCode: typeof ErrorCode.ServerError;
}

export type CountResponse = CountSuccess | CountServerError;
