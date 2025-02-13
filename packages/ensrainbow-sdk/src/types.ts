import { ErrorCode, StatusCode } from "./consts";

export type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface HealthResponse {
  status: "ok";
}

export interface BaseHealResponse<Status extends StatusCode, Error extends ErrorCode> {
  status: Status;
  label?: string | undefined;
  error?: string | undefined;
  errorCode?: Error | undefined;
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
