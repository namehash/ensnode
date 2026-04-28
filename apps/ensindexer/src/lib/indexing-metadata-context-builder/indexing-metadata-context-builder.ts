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
import type { LocalPonderClient } from "@ensnode/ponder-sdk";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import { logger } from "@/lib/logger";
import type { StackInfoBuilder } from "@/lib/stack-info-builder/stack-info-builder";

function invariant_indexingStatusIsUnstartedForIndexingMetadataContextUninitialized(
  inMemoryIndexingStatusSnapshot: OmnichainIndexingStatusSnapshot,
): void {
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
    /**
     * ENSDb Client used to read the currently stored
     * {@link IndexingMetadataContextInitialized} record from ENSDb,
     * which the invariant validation logic in
     * {@link getIndexingMetadataContext} depends on.
     */
    private readonly ensDbClient: EnsDbReader,

    /**
     * IndexingStatusBuilder used to get
     * the current in-memory {@link OmnichainIndexingStatusSnapshot} for building
     * the "in-memory" {@link IndexingMetadataContextInitialized} object
     * within {@link getIndexingMetadataContext}.
     */
    private readonly indexingStatusBuilder: IndexingStatusBuilder,

    /**
     * StackInfoBuilder used to get
     * the current in-memory {@link EnsIndexerStackInfo} for building
     * the "in-memory" {@link IndexingMetadataContextInitialized} object
     * within {@link getIndexingMetadataContext}.
     */
    private readonly stackInfoBuilder: StackInfoBuilder,

    /**
     * Local Ponder Client used to determine if the local Ponder app
     * is running in dev mode, which affects the validation logic applied
     * in {@link getIndexingMetadataContext}.
     */
    private readonly localPonderClient: LocalPonderClient,
  ) {}

  /**
   * Get the current {@link IndexingMetadataContextInitialized} object.
   *
   * Expected to be called while writing the {@link IndexingMetadataContextInitialized} record in ENSDb.
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

    // Build the CrossChainIndexingStatusSnapshot with the current snapshot time.
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

      // If no IndexingMetadataContext has been initialized in ENSDb yet, then
      // the "in-memory" CrossChainIndexingStatusSnapshot must be in
      // "unstarted" status, since onchain events indexing has not started yet.
      invariant_indexingStatusIsUnstartedForIndexingMetadataContextUninitialized(
        inMemoryIndexingStatusSnapshot,
      );
    } else {
      logger.debug({ msg: `Indexing Metadata Context is "initialized"` });
      logger.trace({
        msg: `Indexing Metadata Context`,
        indexingStatus: storedIndexingMetadataContext.indexingStatus,
        stackInfo: storedIndexingMetadataContext.stackInfo,
      });

      // For EnsIndexerPublicConfig, validate in-memory config object
      // compatibility with the stored one, if the stored one is available.
      // The validation is skipped if the local Ponder app is running in dev mode.
      // This is to improve the development experience during ENSIndexer
      // development, by allowing to override the stored config in ENSDb with
      // the current in-memory config, without having to keep them compatible.
      if (!this.localPonderClient.isInDevMode) {
        invariant_ensIndexerPublicConfigIsCompatibleWithStackInfo(
          storedIndexingMetadataContext.stackInfo,
          inMemoryEnsIndexerStackInfo,
        );
      }
    }

    return inMemoryIndexingMetadataContext;
  }
}
