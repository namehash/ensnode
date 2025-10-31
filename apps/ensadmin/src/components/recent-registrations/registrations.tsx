"use client";

import { useIndexingStatus } from "@ensnode/ensnode-react";
import { IndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

import { RecentRegistrations } from "@/components/recent-registrations/components";

export function Registrations() {
  const { status, data: indexingStatus, error } = useIndexingStatus();

  if (status === "pending") {
    return <RecentRegistrations realtimeProjection={undefined} />;
  }

  if (status === "error") {
    return (
      <RecentRegistrations error={{ title: "IndexingStatus error", description: error.message }} />
    );
  }

  // even though indexing status was fetched successfully,
  // it can still refer to a server-side error
  if (indexingStatus.responseCode === IndexingStatusResponseCodes.Error) {
    return (
      <RecentRegistrations
        error={{
          title: "IndexingStatus error",
          description: "Indexing Status is currently unavailable.",
        }}
      />
    );
  }

  return <RecentRegistrations realtimeProjection={indexingStatus.realtimeProjection} />;
}
