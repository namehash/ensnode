import { prettifyError } from "zod/v4";

import type { ChainIdString, PonderStatusChain } from "./chains";
import { PrometheusMetrics, validatePonderMetrics } from "./metrics";
import { makePonderStatusResponseSchema } from "./zod-schemas";

export type PonderStatusResponse = Record<ChainIdString, PonderStatusChain>;

export type PonderMetricsResponse = PrometheusMetrics;

/**
 * Deserialized Ponder Status Response
 *
 * @throws when provided input cannot be parsed successfully
 */
export function deserializePonderStatusResponse(maybePonderStatus: unknown): PonderStatusResponse {
  const schema = makePonderStatusResponseSchema();
  const parsed = schema.safeParse(maybePonderStatus);

  if (parsed.error) {
    throw new Error(`Cannot deserialize PonderStatusResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

/**
 * Deserialize Ponder Metrics Response
 *
 * @throws when provided input cannot be parsed successfully
 */
export function deserializePonderMetricsResponse(
  maybePonderMetrics: string,
): PonderMetricsResponse {
  try {
    const ponderMetrics = PrometheusMetrics.parse(maybePonderMetrics);

    validatePonderMetrics(ponderMetrics);

    return ponderMetrics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Cannot deserialize PonderMetricsResponse:\n${errorMessage}\n`);
  }
}
