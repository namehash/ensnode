import { type AbstractResultOk, ResultCodes } from "../../shared";

/**
 * Data included with a successful Health result.
 */
export type ResultOkHealthData = { message: string };

/**
 * Successful result for Health API requests.
 */
export type ResultOkHealth = AbstractResultOk<ResultOkHealthData>;

export function buildResultOkHealth(data: ResultOkHealthData): ResultOkHealth {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

/**
 * The operation result for Health API requests.
 */
export type HealthServerResult = ResultOkHealth;
