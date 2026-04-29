import { prettifyError } from "zod/v4";

import { buildUnvalidatedCrossChainIndexingStatusSnapshot } from "../../../indexing-status";
import type { Unvalidated } from "../../../shared/types";
import { buildUnvalidatedEnsIndexerStackInfo } from "../../../stack-info";
import {
  type IndexingMetadataContext,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
} from "../indexing-metadata-context";
import type {
  SerializedIndexingMetadataContext,
  SerializedIndexingMetadataContextInitialized,
} from "../serialize/indexing-metadata-context";
import {
  makeIndexingMetadataContextSchema,
  makeSerializedIndexingMetadataContextSchema,
} from "../zod-schemas/indexing-metadata-context";

/**
 * Builds an unvalidated {@link IndexingMetadataContextInitialized} object.
 */
function buildUnvalidatedIndexingMetadataContextInitialized(
  serializedIndexingMetadataContext: SerializedIndexingMetadataContextInitialized,
): Unvalidated<IndexingMetadataContextInitialized> {
  return {
    statusCode: serializedIndexingMetadataContext.statusCode,
    indexingStatus: buildUnvalidatedCrossChainIndexingStatusSnapshot(
      serializedIndexingMetadataContext.indexingStatus,
    ),
    stackInfo: buildUnvalidatedEnsIndexerStackInfo(serializedIndexingMetadataContext.stackInfo),
  };
}

/**
 * Builds an unvalidated {@link IndexingMetadataContext} object to be
 * validated with {@link makeIndexingMetadataContextSchema}.
 *
 * @param serializedIndexingMetadataContext - The serialized indexing metadata context to build from.
 */
function buildUnvalidatedIndexingMetadataContext(
  serializedIndexingMetadataContext: SerializedIndexingMetadataContext,
): Unvalidated<IndexingMetadataContext> {
  switch (serializedIndexingMetadataContext.statusCode) {
    case IndexingMetadataContextStatusCodes.Uninitialized:
      return serializedIndexingMetadataContext;

    case IndexingMetadataContextStatusCodes.Initialized:
      return buildUnvalidatedIndexingMetadataContextInitialized(serializedIndexingMetadataContext);
  }
}

/**
 * Deserialize a serialized {@link IndexingMetadataContext} object.
 */
export function deserializeIndexingMetadataContext(
  serializedIndexingMetadataContext: Unvalidated<SerializedIndexingMetadataContext>,
  valueLabel?: string,
): IndexingMetadataContext {
  const label = valueLabel ?? "IndexingMetadataContext";

  const parsed = makeSerializedIndexingMetadataContextSchema(label)
    .transform(buildUnvalidatedIndexingMetadataContext)
    .pipe(makeIndexingMetadataContextSchema(label))
    .safeParse(serializedIndexingMetadataContext);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize IndexingMetadataContext:\n${prettifyError(parsed.error)}\n`,
    );
  }
  return parsed.data;
}
