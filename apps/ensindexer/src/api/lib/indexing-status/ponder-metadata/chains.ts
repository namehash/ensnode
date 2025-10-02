/**
 * Ponder Metadata: Chains
 *
 * This file describes ideas and functionality related to metadata about chains
 * indexing status. In this module, ideas represented in other Ponder Metadata
 * modules, such as:
 * - Config
 * - Metrics
 * - RPC
 * - Status
 * all come together to form a single view about a chain's indexing status.
 */

import {
  type BlockRef,
  type ChainId,
  type ChainIdString,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  type DeepPartial,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type SerializedChainIndexingStatusSnapshot,
  type SerializedChainIndexingStatusSnapshotBackfill,
  type SerializedChainIndexingStatusSnapshotCompleted,
  type SerializedChainIndexingStatusSnapshotFollowing,
  type SerializedChainIndexingStatusSnapshotQueued,
  type SerializedOmnichainIndexingStatusSnapshot,
  type SerializedOmnichainIndexingStatusSnapshotBackfill,
  type SerializedOmnichainIndexingStatusSnapshotCompleted,
  type SerializedOmnichainIndexingStatusSnapshotFollowing,
  type SerializedOmnichainIndexingStatusSnapshotUnstarted,
  type UnixTimestamp,
  createIndexingConfig,
  deserializeChainIndexingStatusSnapshot,
  deserializeOmnichainIndexingStatusSnapshot,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "@ensnode/ensnode-sdk";
import { PrometheusMetrics } from "@ensnode/ponder-metadata";
import { prettifyError } from "zod/v4/core";
import type { ChainBlockRefs } from "./block-refs";
import type { ChainName } from "./config";
import type { PonderStatus } from "./status";
import { makePonderChainMetadataSchema } from "./zod-schemas";

/**
 * Chain Metadata
 *
 * Chain metadata, required to determine {@link ChainIndexingSnapshot}.
 */
export interface ChainMetadata {
  chainId: ChainId;

  /**
   * Historical Total Blocks
   *
   * Blocks count to be process during backfill.
   */
  historicalTotalBlocks: number;

  /**
   * Is Sync Complete?
   *
   * Tells if the backfill has finished.
   */
  isSyncComplete: boolean;

  /**
   * Is Sync Realtime?
   *
   * Tells if there's ongoing indexing following the backfill.
   */
  isSyncRealtime: boolean;

  /**
   * Ponder blocks config
   *
   * Based on ponder.config.ts output.
   */
  config: {
    startBlock: BlockRef;

    endBlock: BlockRef | null;
  };

  /**
   * Backfill end block
   *
   * The block at which the backfill will end.
   */
  backfillEndBlock: BlockRef;

  /**
   * Sync block
   *
   * The latest block stored in the RPC cache.
   */
  syncBlock: BlockRef;

  /**
   * Status block
   *
   * Either:
   * - the first block to be indexed, or
   * - the last indexed block,
   * for the chain.
   */
  statusBlock: BlockRef;
}

/**
 * Unvalidated representation of {@link ChainMetadata}.
 */
export interface UnvalidatedChainMetadata
  extends DeepPartial<Omit<ChainMetadata, "isSyncComplete" | "isSyncRealtime">> {
  isSyncComplete: number | undefined;
  isSyncRealtime: number | undefined;
}

/**
 * Create {@link ChainIndexingStatusSnapshot} for the indexed chain metadata.
 */
export function createChainIndexingSnapshot(
  chainMetadata: ChainMetadata,
): ChainIndexingStatusSnapshot {
  const {
    config: chainBlocksConfig,
    backfillEndBlock: chainBackfillEndBlock,
    isSyncComplete,
    isSyncRealtime,
    syncBlock: chainSyncBlock,
    statusBlock: chainStatusBlock,
  } = chainMetadata;

  const { startBlock, endBlock } = chainBlocksConfig;
  const config = createIndexingConfig(startBlock, endBlock);

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (chainBlocksConfig.startBlock.number === chainStatusBlock.number) {
    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Queued,
      config,
    } satisfies SerializedChainIndexingStatusSnapshotQueued);
  }

  if (isSyncComplete) {
    if (config.configType !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: chainStatusBlock,
      config,
    } satisfies SerializedChainIndexingStatusSnapshotCompleted);
  }

  if (isSyncRealtime) {
    if (config.configType !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Following,
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      config: {
        configType: config.configType,
        startBlock: config.startBlock,
      },
    } satisfies SerializedChainIndexingStatusSnapshotFollowing);
  }

  return deserializeChainIndexingStatusSnapshot({
    chainStatus: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: chainStatusBlock,
    backfillEndBlock: chainBackfillEndBlock,
    config,
  } satisfies SerializedChainIndexingStatusSnapshotBackfill);
}

/**
 * Create Serialized Omnichain Indexing Snapshot
 *
 * Creates {@link SerializedOmnichainIndexingStatusSnapshot} from serialized chain snapshots and "now" timestamp.
 */
export function createSerializedOmnichainIndexingStatusSnapshot(
  serializedChainSnapshots: Record<ChainIdString, SerializedChainIndexingStatusSnapshot>,
): SerializedOmnichainIndexingStatusSnapshot {
  const chains = Object.values(serializedChainSnapshots);
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingStatusSnapshotQueued
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotUnstarted;
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotBackfill;
    }

    case OmnichainIndexingStatusIds.Completed: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingStatusSnapshotCompleted
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotCompleted;
    }

    case OmnichainIndexingStatusIds.Following:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializedChainSnapshots,
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotFollowing;
  }
}

/**
 * Create serialized chain indexing snapshots.
 *
 * The output of this function is required for
 * calling {@link createOmnichainIndexingSnapshot}.
 */
export function createSerializedChainSnapshots(
  chainNames: ChainName[],
  chainsBlockRefs: Map<ChainName, ChainBlockRefs>,
  metrics: PrometheusMetrics,
  status: PonderStatus,
): Record<ChainIdString, SerializedChainIndexingStatusSnapshot> {
  const chainsMetadata = new Map<ChainName, UnvalidatedChainMetadata>();

  // collect unvalidated chain metadata for each indexed chain
  for (const chainName of chainNames) {
    const chainBlockRefs = chainsBlockRefs.get(chainName);

    const chainMetadata = {
      chainId: status[chainName]?.id,
      config: chainBlockRefs?.config,
      backfillEndBlock: chainBlockRefs?.backfillEndBlock,
      historicalTotalBlocks: metrics.getValue("ponder_historical_total_blocks", {
        chain: chainName,
      }),
      isSyncComplete: metrics.getValue("ponder_sync_is_complete", { chain: chainName }),
      isSyncRealtime: metrics.getValue("ponder_sync_is_realtime", { chain: chainName }),
      syncBlock: {
        number: metrics.getValue("ponder_sync_block", { chain: chainName }),
        timestamp: metrics.getValue("ponder_sync_block_timestamp", { chain: chainName }),
      },
      statusBlock: {
        number: status[chainName]?.block.number,
        timestamp: status[chainName]?.block.timestamp,
      },
    } satisfies UnvalidatedChainMetadata;

    chainsMetadata.set(chainName, chainMetadata);
  }

  // parse chain metadata for each indexed chain
  const schema = makePonderChainMetadataSchema(chainNames);
  const parsed = schema.safeParse(chainsMetadata);

  if (!parsed.success) {
    throw new Error(
      "Failed to build SerializedOmnichainIndexingStatusSnapshot object: \n" +
        prettifyError(parsed.error) +
        "\n",
    );
  }

  return parsed.data;
}
