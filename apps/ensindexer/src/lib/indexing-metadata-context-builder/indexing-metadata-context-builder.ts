import { getUnixTime } from "date-fns";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildIndexingMetadataContextInitialized,
  type EnsIndexerStackInfo,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import { logger } from "@/lib/logger";
import type { StackInfoBuilder } from "@/lib/stack-info-builder/stack-info-builder";

function invariant_indexingStatusIsUnstartedForIndexingMetadataContextUninitialized(
  inMemoryIndexingStatusSnapshot: OmnichainIndexingStatusSnapshot,
): void {
  // Invariant: indexing status must be "unstarted" when the indexing metadata context is uninitialized,
  // since we haven't started processing any onchain events yet
  if (inMemoryIndexingStatusSnapshot.omnichainStatus !== OmnichainIndexingStatusIds.Unstarted) {
    throw new Error(
      `Omnichain indexing status must be "unstarted" for "uninitialized" Indexing Metadata Context. Provided omnichain indexing status "${inMemoryIndexingStatusSnapshot.omnichainStatus}".`,
    );
  }
}

function invariant_ensIndexerPublicConfigIsCompatibleWithStackInfo(
  storedEnsIndexerStackInfo: EnsIndexerStackInfo,
  inMemoryEnsIndexerStackInfo: EnsIndexerStackInfo,
): void {
  const { ensIndexer: storedEnsIndexerPublicConfig } = storedEnsIndexerStackInfo;
  const { ensIndexer: inMemoryEnsIndexerPublicConfig } = inMemoryEnsIndexerStackInfo;

  validateEnsIndexerPublicConfigCompatibility(
    storedEnsIndexerPublicConfig,
    inMemoryEnsIndexerPublicConfig,
  );
}

export class IndexingMetadataContextBuilder {
  constructor(
    private readonly ensDbClient: EnsDbReader,
    private readonly indexingStatusBuilder: IndexingStatusBuilder,
    private readonly stackInfoBuilder: StackInfoBuilder,
  ) {}

  /**
   * Get the current {@link IndexingMetadataContextInitialized} object.
   *
   * Expected to be called while writing an {@link IndexingMetadataContextInitialized} record into ENSDb
   */
  async getIndexingMetadataContext(): Promise<IndexingMetadataContextInitialized> {
    const [
      inMemoryIndexingStatusSnapshot,
      inMemoryEnsIndexerStackInfo,
      storedIndexingMetadataContext,
    ] = await Promise.all([
      this.indexingStatusBuilder.getOmnichainIndexingStatusSnapshot(),
      this.stackInfoBuilder.getStackInfo(),
      this.ensDbClient.getIndexingMetadataContext(),
    ]);

    // Build the {@link CrossChainIndexingStatusSnapshot} with the current snapshot time.
    // This is important to make sure the `snapshotTime` is always up to date in
    // the indexing status snapshot stored within the Indexing Metadata Context record in ENSDb.
    const now = getUnixTime(new Date());
    const crossChainIndexingStatusSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
      inMemoryIndexingStatusSnapshot,
      now,
    );

    const inMemoryIndexingMetadataContext = buildIndexingMetadataContextInitialized(
      crossChainIndexingStatusSnapshot,
      inMemoryEnsIndexerStackInfo,
    );

    if (
      storedIndexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Uninitialized
    ) {
      logger.info({ msg: `Indexing Metadata Context is "uninitialized"` });

      invariant_indexingStatusIsUnstartedForIndexingMetadataContextUninitialized(
        inMemoryIndexingStatusSnapshot,
      );
    } else {
      logger.info({ msg: `Indexing Metadata Context is "initialized"` });
      logger.debug({
        msg: `Indexing Metadata Context`,
        indexingStatus: storedIndexingMetadataContext.indexingStatus,
        stackInfo: storedIndexingMetadataContext.stackInfo,
      });

      invariant_ensIndexerPublicConfigIsCompatibleWithStackInfo(
        storedIndexingMetadataContext.stackInfo,
        inMemoryEnsIndexerStackInfo,
      );
    }

    return inMemoryIndexingMetadataContext;
  }
}
