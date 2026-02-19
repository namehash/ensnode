import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { SerializedEnsIndexerPublicConfig } from "./serialized-types";
import type { EnsIndexerPublicConfig } from "./types";
import {
  makeEnsIndexerPublicConfigSchema,
  makeSerializedEnsIndexerPublicConfigSchema,
} from "./zod-schemas";

/**
 * Builds an unvalidated {@link EnsIndexerPublicConfig} object to be
 * validated with {@link makeEnsIndexerPublicConfigSchema}.
 *
 * @param serializedPublicConfig - The serialized public config to build from.
 * @return An unvalidated {@link EnsIndexerPublicConfig} object.
 */
export function buildUnvalidatedEnsIndexerPublicConfig(
  serializedPublicConfig: SerializedEnsIndexerPublicConfig,
): Unvalidated<EnsIndexerPublicConfig> {
  return {
    ...serializedPublicConfig,
    indexedChainIds: new Set(serializedPublicConfig.indexedChainIds),
  };
}

/**
 * Deserialize value into {@link EnsIndexerPublicConfig} object.
 */
export function deserializeEnsIndexerPublicConfig(
  maybePublicConfig: Unvalidated<SerializedEnsIndexerPublicConfig>,
  valueLabel?: string,
): EnsIndexerPublicConfig {
  const parsed = makeSerializedEnsIndexerPublicConfigSchema(valueLabel)
    .transform(buildUnvalidatedEnsIndexerPublicConfig)
    .pipe(makeEnsIndexerPublicConfigSchema(valueLabel))
    .safeParse(maybePublicConfig);

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
