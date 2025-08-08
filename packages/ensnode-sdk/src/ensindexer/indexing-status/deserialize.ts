import { prettifyError } from "zod/v4";
import type {
  SerializedENSIndexerIndexingStatus,
  SerializedENSIndexerIndexingStatusError,
} from "./serialized-types";
import type { ENSIndexerIndexingStatus, ENSIndexerIndexingStatusError } from "./types";
import { makeENSIndexerIndexingStatusSchema } from "./zod-schemas";

/**
 * Serialize a {@link ENSIndexerIndexingStatus} object.
 */
export function deserializeENSIndexerIndexingStatus(
  maybeConfig: SerializedENSIndexerIndexingStatus,
  valueLabel?: string,
): ENSIndexerIndexingStatus;
export function deserializeENSIndexerIndexingStatus(
  maybeConfig: SerializedENSIndexerIndexingStatusError,
  valueLabel?: string,
): ENSIndexerIndexingStatusError;
export function deserializeENSIndexerIndexingStatus(
  maybeConfig: SerializedENSIndexerIndexingStatus | SerializedENSIndexerIndexingStatusError,
  valueLabel?: string,
): ENSIndexerIndexingStatus | ENSIndexerIndexingStatusError {
  const schema = makeENSIndexerIndexingStatusSchema(valueLabel);
  const parsed = schema.safeParse(maybeConfig);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ENSIndexerIndexingStatus:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
