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

const makeEnsApiVersionInfoSchema = (valueLabel: string = "ENS API version info") =>
  z.object({
    ensApi: z.string().nonempty(`${valueLabel}.ensApi must be a non-empty string`),
    ensNormalize: z.string().nonempty(`${valueLabel}.ensNormalize must be a non-empty string`),
  });

/**
 * Create a Zod schema for validating ENSApiPublicConfig.
 *
 * @param valueLabel - Optional label for the value being validated (used in error messages)
 */
export function makeEnsApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.object({
    theGraphFallback: TheGraphFallbackSchema,
    ensIndexerPublicConfig: makeEnsIndexerPublicConfigSchema(`${label}.ensIndexerPublicConfig`),
    versionInfo: makeEnsApiVersionInfoSchema(`${label}.versionInfo`),
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
    ensIndexerPublicConfig: makeSerializedEnsIndexerPublicConfigSchema(
      `${label}.ensIndexerPublicConfig`,
    ),
    theGraphFallback: TheGraphFallbackSchema,
    versionInfo: makeEnsApiVersionInfoSchema(`${label}.versionInfo`),
  });
}
