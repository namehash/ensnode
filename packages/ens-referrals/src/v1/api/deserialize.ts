import { prettifyError } from "zod/v4";

import type { ReferralProgramCycleConfig } from "../cycle";
import type {
  SerializedReferralProgramCycleConfigSetResponse,
  SerializedReferrerDetailCyclesResponse,
  SerializedReferrerLeaderboardPageResponse,
} from "./serialized-types";
import type {
  ReferralProgramCycleConfigSetResponse,
  ReferrerDetailCyclesResponse,
  ReferrerLeaderboardPageResponse,
} from "./types";
import {
  makeReferralProgramCycleConfigSetArraySchema,
  makeReferralProgramCycleConfigSetResponseSchema,
  makeReferrerDetailCyclesResponseSchema,
  makeReferrerLeaderboardPageResponseSchema,
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
 * Deserialize a {@link ReferrerDetailCyclesResponse} object.
 */
export function deserializeReferrerDetailCyclesResponse(
  maybeResponse: SerializedReferrerDetailCyclesResponse,
  valueLabel?: string,
): ReferrerDetailCyclesResponse {
  const schema = makeReferrerDetailCyclesResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferrerDetailCyclesResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserializes an array of {@link ReferralProgramCycleConfig} objects.
 */
export function deserializeReferralProgramCycleConfigSetArray(
  maybeArray: unknown,
  valueLabel?: string,
): ReferralProgramCycleConfig[] {
  const schema = makeReferralProgramCycleConfigSetArraySchema(valueLabel);
  const parsed = schema.safeParse(maybeArray);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferralProgramCycleConfigSetArray:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferralProgramCycleConfigSetResponse} object.
 */
export function deserializeReferralProgramCycleConfigSetResponse(
  maybeResponse: SerializedReferralProgramCycleConfigSetResponse,
  valueLabel?: string,
): ReferralProgramCycleConfigSetResponse {
  const schema = makeReferralProgramCycleConfigSetResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferralProgramCycleConfigSetResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
