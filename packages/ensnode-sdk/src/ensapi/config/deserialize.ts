import { prettifyError, ZodError } from "zod/v4";

import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";
import { makeEnsApiPublicConfigSchema } from "./zod-schemas";

/**
 * Deserialize a {@link EnsApiPublicConfig} object.
 */
export function deserializeEnsApiPublicConfig(
  maybeConfig: SerializedEnsApiPublicConfig,
  valueLabel?: string,
): EnsApiPublicConfig {
  const schema = makeEnsApiPublicConfigSchema(valueLabel);
  try {
    return schema.parse(maybeConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Cannot deserialize EnsApiPublicConfig:\n${prettifyError(error)}\n`);
    }

    throw error;
  }
}

/**
 * Deserialize a {@link EnsApiPublicConfig} object.
 *
 * @deprecated Use {@link deserializeEnsApiPublicConfig} instead.
 */
export const deserializeENSApiPublicConfig = deserializeEnsApiPublicConfig;
