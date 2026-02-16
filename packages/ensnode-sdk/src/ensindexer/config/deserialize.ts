import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { SerializedENSIndexerPublicConfig } from "./serialized-types";
import type { ENSIndexerPublicConfig } from "./types";
import { makeENSIndexerPublicConfigSchema } from "./zod-schemas";

/**
 * Serialize a {@link ENSIndexerPublicConfig} object.
 */
export function deserializeENSIndexerPublicConfig(
  maybeConfig: Unvalidated<SerializedENSIndexerPublicConfig>,
  valueLabel?: string,
): ENSIndexerPublicConfig {
  const schema = makeENSIndexerPublicConfigSchema(valueLabel);
  const parsed = schema.safeParse(maybeConfig);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ENSIndexerPublicConfig:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
