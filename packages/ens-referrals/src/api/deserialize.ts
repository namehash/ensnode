import { prettifyError } from "zod/v4";

import type { ReferralProgramEditionConfig } from "../edition";
import type {
  SerializedReferralProgramEditionSummariesResponse,
  SerializedReferrerLeaderboardPageResponse,
  SerializedReferrerMetricsEditionsResponse,
} from "./serialized-types";
import type {
  ReferralProgramEditionSummariesResponse,
  ReferrerLeaderboardPageResponse,
  ReferrerMetricsEditionsResponse,
} from "./types";
import {
  makeReferralProgramEditionConfigSetArraySchema,
  makeReferralProgramEditionSummariesResponseSchema,
  makeReferrerLeaderboardPageResponseSchema,
  makeReferrerMetricsEditionsResponseSchema,
} from "./zod-schemas";

/**
 * Deserialize a {@link ReferrerLeaderboardPageResponse} object.
 */
export function deserializeReferrerLeaderboardPageResponse(
  maybeResponse: SerializedReferrerLeaderboardPageResponse,
  valueLabel?: string,
): ReferrerLeaderboardPageResponse {
  const schema = makeReferrerLeaderboardPageResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize SerializedReferrerLeaderboardPageResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferrerMetricsEditionsResponse} object.
 */
export function deserializeReferrerMetricsEditionsResponse(
  maybeResponse: SerializedReferrerMetricsEditionsResponse,
  valueLabel?: string,
): ReferrerMetricsEditionsResponse {
  const schema = makeReferrerMetricsEditionsResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferrerMetricsEditionsResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserializes an array of {@link ReferralProgramEditionConfig} objects.
 */
export function deserializeReferralProgramEditionConfigSetArray(
  maybeArray: unknown,
  valueLabel?: string,
): ReferralProgramEditionConfig[] {
  const schema = makeReferralProgramEditionConfigSetArraySchema(valueLabel);
  const parsed = schema.safeParse(maybeArray);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferralProgramEditionConfigSetArray:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferralProgramEditionSummariesResponse} object.
 */
export function deserializeReferralProgramEditionSummariesResponse(
  maybeResponse: SerializedReferralProgramEditionSummariesResponse,
  valueLabel?: string,
): ReferralProgramEditionSummariesResponse {
  const schema = makeReferralProgramEditionSummariesResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferralProgramEditionSummariesResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
