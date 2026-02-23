import { prettifyError } from "zod/v4";

import type { ReferralProgramEditionConfig } from "../edition";
import type {
  SerializedReferralProgramEditionConfigSetResponse,
  SerializedReferrerLeaderboardPageResponse,
  SerializedReferrerMetricsEditionsResponse,
} from "./serialized-types";
import type {
  ReferralProgramEditionConfigSetResponse,
  ReferrerLeaderboardPageResponse,
  ReferrerMetricsEditionsResponse,
} from "./types";
import {
  makeReferralProgramEditionConfigSetArraySchema,
  makeReferralProgramEditionConfigSetResponseSchema,
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

  // makeReferralProgramRulesSchema uses .passthrough() for forward compatibility with unknown award
  // model types, widening its output to { awardModel: string } & Record<string, unknown>.
  // This assertion is safe: the schema validates all known fields correctly.
  return parsed.data as unknown as ReferralProgramEditionConfig[];
}

/**
 * Deserialize a {@link ReferralProgramEditionConfigSetResponse} object.
 */
export function deserializeReferralProgramEditionConfigSetResponse(
  maybeResponse: SerializedReferralProgramEditionConfigSetResponse,
  valueLabel?: string,
): ReferralProgramEditionConfigSetResponse {
  const schema = makeReferralProgramEditionConfigSetResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferralProgramEditionConfigSetResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  // Same reason as deserializeReferralProgramEditionConfigSetArray above.
  return parsed.data as unknown as ReferralProgramEditionConfigSetResponse;
}
