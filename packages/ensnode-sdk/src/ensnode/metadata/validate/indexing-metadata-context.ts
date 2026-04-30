import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { IndexingMetadataContextInitialized } from "../indexing-metadata-context";
import { makeIndexingMetadataContextInitializedSchema } from "../zod-schemas/indexing-metadata-context";

/**
 * Validate a maybe {@link IndexingMetadataContextInitialized} object.
 */
export function validateIndexingMetadataContextInitialized(
  maybeIndexingMetadataContext: Unvalidated<IndexingMetadataContextInitialized>,
  valueLabel?: string,
): IndexingMetadataContextInitialized {
  const label = valueLabel ?? "IndexingMetadataContextInitialized";
  const result = makeIndexingMetadataContextInitializedSchema(label).safeParse(
    maybeIndexingMetadataContext,
  );

  if (result.error) {
    throw new Error(`Cannot validate ${label}:\n${prettifyError(result.error)}\n`);
  }
  return result.data;
}
