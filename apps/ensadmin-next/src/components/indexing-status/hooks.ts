import { selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";

export interface NetworkIndexingStatus {
  totalBlocksCount: number;
  cachedBlocksCount: number;
  firstBlockToIndex: {
    height: number;
    timestamp: number;
    utc: string;
  } | null;
  lastSyncedBlock: {
    height: number;
    timestamp: number;
    utc: string;
  };
  lastIndexedBlock: {
    height: number;
    timestamp: number;
    utc: string;
  } | null;
  latestSafeBlock: {
    height: number;
    timestamp: number;
    utc: string;
  };
  isRealtime: boolean;
  isComplete: boolean;
  isQueued: boolean;
  status: string;
}

export interface IndexingStatus {
  app: {
    name: string;
    version: string;
  };
  deps: {
    ponder: string;
    nodejs: string;
  };
  env: {
    ACTIVE_PLUGINS: string;
    DATABASE_SCHEMA: string;
    ENS_DEPLOYMENT_CHAIN: string;
  };
  runtime: {
    codebaseBuildId: string;
    indexingStartedAt: number;
    networkIndexingStatus: Record<string, NetworkIndexingStatus>;
  };
}

async function fetchIndexingStatus(baseUrl: string): Promise<IndexingStatus> {
  const response = await fetch(new URL(`/metadata`, baseUrl));

  if (!response.ok) {
    throw new Error("Failed to fetch indexing status");
  }

  return response.json();
}

export function useIndexingStatus(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["indexing-status", ensNodeUrl],
    queryFn: () => fetchIndexingStatus(ensNodeUrl),
  });
}
