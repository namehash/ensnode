import type { EnsNode } from "@/components/ensnode";
import { getChainName } from "@/lib/chains";
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
): GlobalIndexingStatusViewModel {
  const indexingStartDatesAcrossNetworks = Object.values(networkIndexingStatus).map(
    (status) => status.firstBlockToIndex.timestamp,
  );
  const firstBlockToIndexGloballyTimestamp = Math.min(...indexingStartDatesAcrossNetworks);

  const networkStatusesViewModel = Object.entries(networkIndexingStatus).map(
    ([chainId, networkIndexingStatus]) =>
      networkIndexingStatusViewModel(
        chainId,
        networkIndexingStatus,
        firstBlockToIndexGloballyTimestamp,
      ),
  ) satisfies Array<NetworkStatusViewModel>;

  const currentIndexingDate = Math.max(
    // get the last indexed block date for each network for which it is available
    ...networkStatusesViewModel
      .filter((n) => Boolean(n.lastIndexedBlock))
      .map((n) => n.lastIndexedBlock!.timestamp),
  );

  return {
    networkStatuses: networkStatusesViewModel,
    currentIndexingDate: fromUnixTime(currentIndexingDate),
    indexingStartsAt: fromUnixTime(firstBlockToIndexGloballyTimestamp),
  };
}

/**
 * View model for the network indexing status.
 * @param chainId
 * @param networkStatus
 * @param firstBlockToIndexGloballyTimestamp
 * @returns
 */
export function networkIndexingStatusViewModel(
  chainId: string,
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
    name: getChainName(parseInt(chainId, 10)),
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
    { label: "ENS Deployment Chain", value: env.ENS_DEPLOYMENT_CHAIN },
    { label: "Database Schema", value: env.DATABASE_SCHEMA },
  ] as const;
}
