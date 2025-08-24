import { prettifyError } from "zod/v4";
import { SerializedENSIndexerOverallIndexingStatus } from "./serialized-types";
import { ENSIndexerOverallIndexingStatus } from "./types";
import { makeENSIndexerIndexingStatusSchema } from "./zod-schemas";

/**
 * Serialize a {@link ENSIndexerOverallIndexingStatus} object.
 */
export function deserializeENSIndexerIndexingStatus(
  maybeStatus: SerializedENSIndexerOverallIndexingStatus,
  valueLabel?: string,
): ENSIndexerOverallIndexingStatus {
  const schema = makeENSIndexerIndexingStatusSchema(valueLabel);
  const parsed = schema.safeParse(maybeStatus);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ENSIndexerIndexingStatus:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
