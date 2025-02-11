import { ErrorCode, StatusCode } from "./consts";

export type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface HealthResponse {
  status: "ok";
}

export interface BaseHealResponse<Status extends StatusCode> {
  status: Status;
  label?: string | undefined;
  error?: string | undefined;
  errorCode?: ErrorCode | undefined;
}

export interface HealSuccess extends BaseHealResponse<typeof StatusCode.Success> {
  status: typeof StatusCode.Success;
  label: string;
  error?: undefined;
  errorCode?: undefined;
}

export interface HealError extends BaseHealResponse<typeof StatusCode.Error> {
  status: typeof StatusCode.Error;
  label?: undefined;
  error: string;
  errorCode: ErrorCode;
}

export type HealResponse = HealSuccess | HealError;

export interface BaseCountResponse<Status extends StatusCode> {
  status: Status;
  count?: number | undefined;
  timestamp?: string | undefined;
  error?: string | undefined;
  errorCode?: ErrorCode | undefined;
}

export interface CountSuccess extends BaseCountResponse<typeof StatusCode.Success> {
  status: typeof StatusCode.Success;
  /** The total number of labels. Always a non-negative integer. */
  count: number;
  timestamp: string;
  error?: undefined;
  errorCode?: undefined;
}

export interface CountError extends BaseCountResponse<typeof StatusCode.Error> {
  status: typeof StatusCode.Error;
  count?: undefined;
  timestamp?: undefined;
  error: string;
  errorCode: ErrorCode;
}

export type CountResponse = CountSuccess | CountError;
