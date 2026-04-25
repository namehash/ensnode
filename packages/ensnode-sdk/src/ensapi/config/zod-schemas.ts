import { z } from "zod/v4";

import {
  TheGraphCannotFallbackReasonSchema,
  TheGraphFallbackSchema,
} from "../../shared/config/thegraph";
import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";

export { TheGraphCannotFallbackReasonSchema, TheGraphFallbackSchema };

const makeEnsApiVersionInfoSchema = (valueLabel: string = "ENS API version info") =>
  z.object({
    ensApi: z.string().nonempty(`${valueLabel}.ensApi must be a non-empty string`),
    ensNormalize: z.string().nonempty(`${valueLabel}.ensNormalize must be a non-empty string`),
  });

/**
 * Create a Zod schema for validating {@link EnsApiPublicConfig}.
 *
 * @param valueLabel - Optional label for the value being validated (used in error messages)
 */
export function makeEnsApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.object({
    theGraphFallback: TheGraphFallbackSchema,
    versionInfo: makeEnsApiVersionInfoSchema(`${label}.versionInfo`),
  });
}

/**
 * Create a Zod schema for validating {@link SerializedEnsApiPublicConfig}.
 */
export const makeSerializedEnsApiPublicConfigSchema = makeEnsApiPublicConfigSchema;
