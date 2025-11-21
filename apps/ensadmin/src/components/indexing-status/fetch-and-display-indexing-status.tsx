"use client";

import { DisplayIndexingStatusPanelMemo } from "./display-indexing-status-panel";
import { useStatefulFetchIndexingStatus } from "./use-fetch-stateful-indexing-status";

interface FetchAndDisplayIndexingStatusPanelProps {
  title: string;
}

/**
 * Fetches Indexing Status through ENSNode and displays the Indexing Status Panel.
 */
export function FetchAndDisplayIndexingStatusPanel({
  title,
}: FetchAndDisplayIndexingStatusPanelProps) {
  const indexingStatus = useStatefulFetchIndexingStatus({
    query: {
      refetchInterval: 5 * 1000,
    },
  });

  return <DisplayIndexingStatusPanelMemo title={title} indexingStatus={indexingStatus} />;
}
