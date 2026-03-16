import { prettifyError } from "zod/v4";

import { buildUnvalidatedEnsIndexerPublicConfig } from "../../ensindexer/config/deserialize";
import type { Unvalidated } from "../../shared/types";
import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";
import {
  makeEnsApiPublicConfigSchema,
  makeSerializedEnsApiPublicConfigSchema,
} from "./zod-schemas";

/**
 * Builds an unvalidated {@link EnsApiPublicConfig} object to be
 * validated with {@link makeEnsApiPublicConfigSchema}.
 *
 * @param serializedPublicConfig - The serialized public config to build from.
 * @return An unvalidated {@link EnsApiPublicConfig} object.
 */
function buildUnvalidatedEnsApiPublicConfig(
  serializedPublicConfig: SerializedEnsApiPublicConfig,
): Unvalidated<EnsApiPublicConfig> {
  return {
    ...serializedPublicConfig,
    ensIndexerPublicConfig: buildUnvalidatedEnsIndexerPublicConfig(
      serializedPublicConfig.ensIndexerPublicConfig,
    ),
  };
}

/**
 * Deserialize value into {@link EnsApiPublicConfig} object.
 */
export function deserializeEnsApiPublicConfig(
  maybePublicConfig: Unvalidated<SerializedEnsApiPublicConfig>,
  valueLabel?: string,
): EnsApiPublicConfig {
  const parsed = makeSerializedEnsApiPublicConfigSchema(valueLabel)
    .transform(buildUnvalidatedEnsApiPublicConfig)
    .pipe(makeEnsApiPublicConfigSchema(valueLabel))
    .safeParse(maybePublicConfig);

  if (parsed.error) {
    throw new Error(`Cannot deserialize EnsApiPublicConfig:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

/**
 * Deserialize a {@link EnsApiPublicConfig} object.
 *
 * @deprecated Use {@link deserializeEnsApiPublicConfig} instead.
 */
export const deserializeENSApiPublicConfig = deserializeEnsApiPublicConfig;
