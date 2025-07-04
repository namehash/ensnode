import type { EnsNode } from "@/components/ensnode";
import { getChainName } from "@/components/ui/ChainName";
import { getChainById } from "@/lib/chains";
import { type ENSNamespaceId } from "@ensnode/datasources";
import { fromUnixTime } from "date-fns";
/**
 * Basic information about a block and its date.
 */
export interface BlockInfoViewModel extends EnsNode.BlockInfo {
  get date(): Date;
}

export interface ChainIndexingPhaseViewModel {
  state: "queued" | "indexing";
  startDate: Date;
  endDate: Date;
}

/**
 * Chain status view model, includes indexing phases.
 */
export interface ChainStatusViewModel {
  chainId: number;
  chainName: string;
  firstBlockToIndex: BlockInfoViewModel;
  lastIndexedBlock: BlockInfoViewModel | null;
  lastSyncedBlock: BlockInfoViewModel | null;
  latestSafeBlock: BlockInfoViewModel;
  phases: Array<ChainIndexingPhaseViewModel>;
}

/**
 * Global indexing status view model, includes chain status view models.
 */
export interface GlobalIndexingStatusViewModel {
  /** list of chain status view models */
  chainStatuses: Array<ChainStatusViewModel>;

  /** indexing starts at */
  indexingStartsAt: Date;

  /** latest indexed block date across all chains */
  currentIndexingDate: Date | null;
}

/**
 * View model for the global indexing status. Includes chain status view models.
 *
 * @param chainIndexingStatuses
 * @param namespaceId ENS namespace identifier
 * @returns
 */
export function globalIndexingStatusViewModel(
  chainIndexingStatuses: Record<number, EnsNode.ChainIndexingStatus>,
  namespaceId: ENSNamespaceId,
): GlobalIndexingStatusViewModel {
  const indexingStartDatesAcrossChains = Object.values(chainIndexingStatuses).map(
    (status) => status.firstBlockToIndex.timestamp,
  );
  const firstBlockToIndexGloballyTimestamp = Math.min(...indexingStartDatesAcrossChains);

  const chainStatusesViewModel = Object.values(chainIndexingStatuses).map((chainIndexingStatus) =>
    chainIndexingStatusViewModel(chainIndexingStatus, firstBlockToIndexGloballyTimestamp),
  ) satisfies Array<ChainStatusViewModel>;

  // Sort the chain statuses by the first block to index timestamp
  chainStatusesViewModel.sort(
    (a, b) => a.firstBlockToIndex.timestamp - b.firstBlockToIndex.timestamp,
  );

  const lastIndexedBlockDates = chainStatusesViewModel
    .filter((n) => Boolean(n.lastIndexedBlock))
    .map((n) => n.lastIndexedBlock!.timestamp);

  const currentIndexingDate =
    lastIndexedBlockDates.length > 0 ? fromUnixTime(Math.min(...lastIndexedBlockDates)) : null;

  return {
    chainStatuses: chainStatusesViewModel,
    indexingStartsAt: fromUnixTime(firstBlockToIndexGloballyTimestamp),
    currentIndexingDate,
  };
}

/**
 * View model for the chain indexing status.
 *
 * @param chainStatus
 * @param firstBlockToIndexGloballyTimestamp
 * @returns
 */
export function chainIndexingStatusViewModel(
  chainStatus: EnsNode.ChainIndexingStatus,
  firstBlockToIndexGloballyTimestamp: number,
): ChainStatusViewModel {
  const phases: ChainStatusViewModel["phases"] = [];

  const { lastIndexedBlock, lastSyncedBlock, latestSafeBlock, firstBlockToIndex, chainId } =
    chainStatus;

  const chainName = getChainName(chainId);

  if (firstBlockToIndex.timestamp > firstBlockToIndexGloballyTimestamp) {
    phases.push({
      state: "queued" as const,
      startDate: fromUnixTime(firstBlockToIndexGloballyTimestamp),
      endDate: fromUnixTime(firstBlockToIndex.timestamp),
    });
  }

  phases.push({
    state: "indexing" as const,
    startDate: fromUnixTime(firstBlockToIndex.timestamp),
    endDate: fromUnixTime(latestSafeBlock.timestamp),
  });

  return {
    chainId,
    chainName,
    latestSafeBlock: blockViewModel(latestSafeBlock),
    firstBlockToIndex: blockViewModel(firstBlockToIndex),
    lastIndexedBlock: lastIndexedBlock ? blockViewModel(lastIndexedBlock) : null,
    lastSyncedBlock: lastSyncedBlock ? blockViewModel(lastSyncedBlock) : null,
    phases,
  } satisfies ChainStatusViewModel;
}

/**
 * View model for a block. Includes a date object.
 *
 * @param block
 * @returns
 */
export function blockViewModel(block: EnsNode.BlockInfo): BlockInfoViewModel {
  return {
    ...block,
    get date(): Date {
      return fromUnixTime(block.timestamp);
    },
  };
}

export function ensNodeDepsViewModel(deps: EnsNode.Metadata["deps"]) {
  return [
    { label: "Ponder", value: deps.ponder },
    { label: "Node.js", value: deps.nodejs },
  ] as const;
}

export function ensNodeEnvViewModel(env: EnsNode.Metadata["env"]) {
  return [
    { label: "Active Plugins", value: env.PLUGINS },
    { label: "ENS Namespace", value: env.NAMESPACE },
    { label: "Database Schema", value: env.DATABASE_SCHEMA },
  ] as const;
}

/**
 * View model for the ENSRainbow version info.
 *
 * @param runtime The runtime info from the ENSNode metadata
 * @returns An array of label-value pairs for ENSRainbow version info, or null if not available
 */
export function ensRainbowViewModel(runtime: EnsNode.Metadata["runtime"]) {
  //TODO: uncomment and fix this when current ENSIndexer is deployed
  // if (!runtime.ensRainbow) {
  //   return null;
  // }

  // return [
  //   { label: "Version", value: runtime.ensRainbow.version },
  //   { label: "Schema Version", value: runtime.ensRainbow.schema_version.toString() },
  // ] as const;

  return [
    { label: "Version", value: "0.1.0" },
    { label: "Schema Version", value: 2 },
  ] as const;
}
