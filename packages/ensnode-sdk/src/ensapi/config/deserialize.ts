import { prettifyError, ZodError } from "zod/v4";

import type { SerializedENSApiPublicConfig } from "./serialized-types";
import type { ENSApiPublicConfig } from "./types";
import { makeENSApiPublicConfigSchema } from "./zod-schemas";

/**
 * Deserialize a {@link ENSApiPublicConfig} object.
 */
export function deserializeENSApiPublicConfig(
  maybeConfig: SerializedENSApiPublicConfig,
  valueLabel?: string,
): ENSApiPublicConfig {
  const schema = makeENSApiPublicConfigSchema(valueLabel);
  try {
    return schema.parse(maybeConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Cannot deserialize ENSApiPublicConfig:\n${prettifyError(error)}\n`);
    }

    throw error;
  }
}
