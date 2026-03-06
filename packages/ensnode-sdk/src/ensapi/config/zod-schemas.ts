import { z } from "zod/v4";

import {
  makeEnsIndexerPublicConfigSchema,
  makeSerializedEnsIndexerPublicConfigSchema,
} from "../../ensindexer/config/zod-schemas";
import {
  TheGraphCannotFallbackReasonSchema,
  TheGraphFallbackSchema,
} from "../../shared/config/thegraph";

export { TheGraphCannotFallbackReasonSchema, TheGraphFallbackSchema };

export const makeEnsApiVersionSchema = () =>
  z.string().min(1, `ENSApi version must be a non-empty string`);

/**
 * Create a Zod schema for validating ENSApiPublicConfig.
 *
 * @param valueLabel - Optional label for the value being validated (used in error messages)
 */
export function makeEnsApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.object({
    version: makeEnsApiVersionSchema(),
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

export function makeSerializedEnsApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.object({
    version: makeEnsApiVersionSchema(),
    theGraphFallback: TheGraphFallbackSchema,
    ensIndexerPublicConfig: makeSerializedEnsIndexerPublicConfigSchema(
      `${label}.ensIndexerPublicConfig`,
    ),
  });
}
