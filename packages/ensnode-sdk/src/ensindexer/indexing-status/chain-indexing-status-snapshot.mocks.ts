import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import type { ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill } from "./omnichain-indexing-status-snapshot";

export const chainStatusesQueued = [
  {
    chainStatus: ChainIndexingStatusIds.Queued,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: latestBlockRef,
    },
  },
  {
    chainStatus: ChainIndexingStatusIds.Queued,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: laterBlockRef,
    },
  },
] satisfies ChainIndexingStatusSnapshotQueued[];

export const chainStatusesCompleted = [
  {
    chainStatus: ChainIndexingStatusIds.Completed,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earlierBlockRef,

      endBlock: latestBlockRef,
    },
    latestIndexedBlock: latestBlockRef,
  },

  {
    chainStatus: ChainIndexingStatusIds.Completed,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: laterBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
  },
] satisfies ChainIndexingStatusSnapshotCompleted[];

export const chainStatusesBackfillMixed = [
  {
    chainStatus: ChainIndexingStatusIds.Queued,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: latestBlockRef,
    },
  } satisfies ChainIndexingStatusSnapshotQueued,

  {
    chainStatus: ChainIndexingStatusIds.Backfill,
    config: {
      configType: ChainIndexingConfigTypeIds.Indefinite,
      startBlock: earliestBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
    backfillEndBlock: latestBlockRef,
  } satisfies ChainIndexingStatusSnapshotBackfill,

  {
    chainStatus: ChainIndexingStatusIds.Completed,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: laterBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
  } satisfies ChainIndexingStatusSnapshotCompleted,
] satisfies ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill[];

export const chainStatusesFollowingMixed = [
  {
    chainStatus: ChainIndexingStatusIds.Following,
    config: {
      configType: ChainIndexingConfigTypeIds.Indefinite,
      startBlock: earlierBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
    latestKnownBlock: latestBlockRef,
  } satisfies ChainIndexingStatusSnapshotFollowing,

  {
    chainStatus: ChainIndexingStatusIds.Backfill,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: latestBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
    backfillEndBlock: latestBlockRef,
  } satisfies ChainIndexingStatusSnapshotBackfill,

  {
    chainStatus: ChainIndexingStatusIds.Completed,
    config: {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock: earliestBlockRef,
      endBlock: laterBlockRef,
    },
    latestIndexedBlock: laterBlockRef,
  } satisfies ChainIndexingStatusSnapshotCompleted,
] satisfies ChainIndexingStatusSnapshot[];
