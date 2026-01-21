import { type AbstractResultOk, ResultCodes } from "../../shared";

/**
 * Successful result data for Health API requests.
 */
export type HealthResultOkData = string;

/**
 * Successful result for Health API requests.
 */
export type HealthResultOk = AbstractResultOk<HealthResultOkData>;

export function buildHealthResultOk(data: HealthResultOkData): HealthResultOk {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

/**
 * The operation result for Health API requests.
 */
export type HealthServerResult = HealthResultOk;
