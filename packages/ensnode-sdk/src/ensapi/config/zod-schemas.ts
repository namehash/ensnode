import { z } from "zod/v4";

import { makeENSIndexerPublicConfigSchema } from "../../ensindexer/config/zod-schemas";

export const TheGraphCannotFallbackReasonSchema = z.enum({
  NoApiKey: "no-api-key",
  NoSubgraphUrl: "no-subgraph-url",
});

export const TheGraphFallbackSchema = z.strictObject({
  canFallback: z.boolean(),
  reason: TheGraphCannotFallbackReasonSchema.nullable(),
});

/**
 * Create a Zod schema for validating a serialized ENSApiPublicConfig.
 *
 * @param valueLabel - Optional label for the value being validated (used in error messages)
 */
export function makeENSApiPublicConfigSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSApiPublicConfig";

  return z.strictObject({
    version: z.string().min(1, `${label}.version must be a non-empty string`),
    theGraphFallback: TheGraphFallbackSchema,
    ensIndexerPublicConfig: makeENSIndexerPublicConfigSchema(`${label}.ensIndexerPublicConfig`),
  });
}
