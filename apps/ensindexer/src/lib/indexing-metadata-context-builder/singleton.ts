import { ensDbClient } from "@/lib/ensdb/singleton";
import { IndexingMetadataContextBuilder } from "@/lib/indexing-metadata-context-builder/indexing-metadata-context-builder";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
import { stackInfoBuilder } from "@/lib/stack-info-builder/singleton";

/**
 * Singleton {@link IndexingMetadataContextBuilder} instance to use across ENSIndexer modules.
 */
export const indexingMetadataContextBuilder = new IndexingMetadataContextBuilder(
  ensDbClient,
  indexingStatusBuilder,
  stackInfoBuilder,
);
