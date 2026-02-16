import { prettifyError } from "zod/v4";

import type { SerializedEnsIndexerPublicConfig } from "./serialized-types";
import type { EnsIndexerPublicConfig } from "./types";
import { makeEnsIndexerPublicConfigSchema } from "./zod-schemas";

/**
 * Deserialize object into a {@link EnsIndexerPublicConfig} object.
 */
export function deserializeEnsIndexerPublicConfig(
  maybeConfig: SerializedEnsIndexerPublicConfig,
  valueLabel?: string,
): EnsIndexerPublicConfig {
  const schema = makeEnsIndexerPublicConfigSchema(valueLabel);
  const parsed = schema.safeParse(maybeConfig);

  if (parsed.error) {
    throw new Error(`Cannot deserialize EnsIndexerPublicConfig:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

/**
 * Deserialize object into a {@link EnsIndexerPublicConfig} object.
 *
 * @deprecated Use {@link deserializeEnsIndexerPublicConfig} instead.
 */
export const deserializeENSIndexerPublicConfig = deserializeEnsIndexerPublicConfig;
