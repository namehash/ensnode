import { z } from "zod/v4";

import { makeEnsIndexerPublicConfigSchema } from "../../ensindexer/config/zod-schemas";
import {
  TheGraphCannotFallbackReasonSchema,
  TheGraphFallbackSchema,
} from "../../shared/config/thegraph";

export { TheGraphCannotFallbackReasonSchema, TheGraphFallbackSchema };

/**
 * Create a Zod schema for validating a serialized ENSApiPublicConfig.
 *
 * @param valueLabel - Optional label for the value being validated (used in error messages)
 */
export function makeEnsApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.strictObject({
    version: z.string().min(1, `${label}.version must be a non-empty string`),
    theGraphFallback: TheGraphFallbackSchema,
    ensIndexerPublicConfig: makeEnsIndexerPublicConfigSchema(`${label}.ensIndexerPublicConfig`),
  });
}

/**
 * Create a Zod schema for validating a serialized ENSApiPublicConfig.
 *
 * @deprecated Use {@link makeEnsApiPublicConfigSchema} instead.
 */
export const makeENSApiPublicConfigSchema = makeEnsApiPublicConfigSchema;
