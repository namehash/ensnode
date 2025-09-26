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
  type ChainIndexingSnapshot,
  type ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingStatusIds,
  type DeepPartial,
  type OmnichainIndexingSnapshot,
  OmnichainIndexingStatusIds,
  type SerializedChainIndexingSnapshot,
  type SerializedChainIndexingSnapshotBackfill,
  type SerializedChainIndexingSnapshotCompleted,
  type SerializedChainIndexingSnapshotFollowing,
  type SerializedChainIndexingSnapshotQueued,
  type SerializedOmnichainIndexingSnapshot,
  type SerializedOmnichainIndexingSnapshotBackfill,
  type SerializedOmnichainIndexingSnapshotCompleted,
  type SerializedOmnichainIndexingSnapshotFollowing,
  type SerializedOmnichainIndexingSnapshotUnstarted,
  type UnixTimestamp,
  createIndexingConfig,
  deserializeChainIndexingSnapshot,
  deserializeOmnichainIndexingSnapshot,
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
 * Create {@link ChainIndexingSnapshot} for the indexed chain metadata.
 */
export function createChainIndexingSnapshot(chainMetadata: ChainMetadata): ChainIndexingSnapshot {
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
    return deserializeChainIndexingSnapshot({
      status: ChainIndexingStatusIds.Queued,
      config,
    } satisfies SerializedChainIndexingSnapshotQueued);
  }

  if (isSyncComplete) {
    if (config.type !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingSnapshot({
      status: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: chainStatusBlock,
      config,
    } satisfies SerializedChainIndexingSnapshotCompleted);
  }

  if (isSyncRealtime) {
    if (config.type !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingSnapshot({
      status: ChainIndexingStatusIds.Following,
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      config: {
        type: config.type,
        startBlock: config.startBlock,
      },
    } satisfies SerializedChainIndexingSnapshotFollowing);
  }

  return deserializeChainIndexingSnapshot({
    status: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: chainStatusBlock,
    backfillEndBlock: chainBackfillEndBlock,
    config,
  } satisfies SerializedChainIndexingSnapshotBackfill);
}

/**
 * Create Omnichain Indexing Snapshot
 *
 * Creates {@link OmnichainIndexingSnapshot} from serialized chain snapshots and "now" timestamp.
 */
export function createOmnichainIndexingSnapshot(
  serializedChainSnapshots: Record<ChainIdString, SerializedChainIndexingSnapshot>,
  nowTimestamp: UnixTimestamp,
): OmnichainIndexingSnapshot {
  const chains = Object.values(serializedChainSnapshots);
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);
  const snapshotTime = nowTimestamp;

  let serializedOmnichainSnapshot: SerializedOmnichainIndexingSnapshot;

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingSnapshotQueued
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotUnstarted;
      break;
    }

    case OmnichainIndexingStatusIds.Backfill: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotBackfill;
      break;
    }

    case OmnichainIndexingStatusIds.Completed: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingSnapshotCompleted
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotCompleted;
      break;
    }

    case OmnichainIndexingStatusIds.Following:
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializedChainSnapshots,
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotFollowing;
      break;
  }

  return deserializeOmnichainIndexingSnapshot(serializedOmnichainSnapshot);
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
): Record<ChainIdString, SerializedChainIndexingSnapshot> {
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
      "Failed to build SerializedOmnichainIndexingSnapshot object: \n" +
        prettifyError(parsed.error) +
        "\n",
    );
  }

  return parsed.data;
}
