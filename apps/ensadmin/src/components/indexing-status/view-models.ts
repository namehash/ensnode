import type { EnsNode } from "@/components/ensnode";
import { getChainById } from "@/lib/chains";
import { type ENSNamespaceId } from "@ensnode/datasources";
import { fromUnixTime } from "date-fns";
/**
 * Basic information about a block and its date.
 */
export interface BlockInfoViewModel extends EnsNode.BlockInfo {
  get date(): Date;
}

export interface NetworkIndexingPhaseViewModel {
  state: "queued" | "indexing";
  startDate: Date;
  endDate: Date;
}

/**
 * Network status view model, includes indexing phases.
 */
export interface NetworkStatusViewModel {
  name: string;
  firstBlockToIndex: BlockInfoViewModel;
  lastIndexedBlock: BlockInfoViewModel | null;
  lastSyncedBlock: BlockInfoViewModel | null;
  latestSafeBlock: BlockInfoViewModel;
  phases: Array<NetworkIndexingPhaseViewModel>;
}

/**
 * Global indexing status view model, includes network status view models.
 */
export interface GlobalIndexingStatusViewModel {
  /** list of network status view models */
  networkStatuses: Array<NetworkStatusViewModel>;

  /** indexing starts at */
  indexingStartsAt: Date;

  /** latest indexed block date across all networks */
  currentIndexingDate: Date | null;
}

/**
 * View model for the global indexing status. Includes network status view models.
 *
 * @param networkIndexingStatus
 * @returns
 */
export function globalIndexingStatusViewModel(
  networkIndexingStatus: Record<number, EnsNode.NetworkIndexingStatus>,
  namespace: ENSNamespaceId,
): GlobalIndexingStatusViewModel {
  const indexingStartDatesAcrossNetworks = Object.values(networkIndexingStatus).map(
    (status) => status.firstBlockToIndex.timestamp,
  );
  const firstBlockToIndexGloballyTimestamp = Math.min(...indexingStartDatesAcrossNetworks);
  const getChainName = (chainId: number) => getChainById(namespace, chainId).name;

  const networkStatusesViewModel = Object.entries(networkIndexingStatus).map(
    ([chainId, networkIndexingStatus]) =>
      networkIndexingStatusViewModel(
        getChainName(parseInt(chainId, 10)),
        networkIndexingStatus,
        firstBlockToIndexGloballyTimestamp,
      ),
  ) satisfies Array<NetworkStatusViewModel>;

  // Sort the network statuses by the first block to index timestamp
  networkStatusesViewModel.sort(
    (a, b) => a.firstBlockToIndex.timestamp - b.firstBlockToIndex.timestamp,
  );

  const lastIndexedBlockDates = networkStatusesViewModel
    .filter((n) => Boolean(n.lastIndexedBlock))
    .map((n) => n.lastIndexedBlock!.timestamp);

  const currentIndexingDate =
    lastIndexedBlockDates.length > 0 ? fromUnixTime(Math.max(...lastIndexedBlockDates)) : null;

  return {
    networkStatuses: networkStatusesViewModel,
    indexingStartsAt: fromUnixTime(firstBlockToIndexGloballyTimestamp),
    currentIndexingDate,
  };
}

/**
 * View model for the network indexing status.
 * @param chainName
 * @param networkStatus
 * @param firstBlockToIndexGloballyTimestamp
 * @returns
 */
export function networkIndexingStatusViewModel(
  chainName: string,
  networkStatus: EnsNode.NetworkIndexingStatus,
  firstBlockToIndexGloballyTimestamp: number,
): NetworkStatusViewModel {
  const phases: NetworkStatusViewModel["phases"] = [];

  const { lastIndexedBlock, lastSyncedBlock, latestSafeBlock, firstBlockToIndex } = networkStatus;

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
    name: chainName,
    latestSafeBlock: blockViewModel(latestSafeBlock),
    firstBlockToIndex: blockViewModel(firstBlockToIndex),
    lastIndexedBlock: lastIndexedBlock ? blockViewModel(lastIndexedBlock) : null,
    lastSyncedBlock: lastSyncedBlock ? blockViewModel(lastSyncedBlock) : null,
    phases,
  } satisfies NetworkStatusViewModel;
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
    { label: "Active Plugins", value: env.ACTIVE_PLUGINS },
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
  //   { label: "Schema Version", value: runtime.ensRainbow.schemaVersion.toString() },
  // ] as const;

  return [
    { label: "Version", value: "0.1.0" },
    { label: "Schema Version", value: 2 },
  ] as const;
}
