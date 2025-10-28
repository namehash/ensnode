"use client";

import { useIndexingStatus } from "@ensnode/ensnode-react";
import { IndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

import { RecentRegistrations } from "@/components/recent-registrations/components";

export function Registrations() {
  const { status, data: indexingStatus, error } = useIndexingStatus();

  if (status === "pending") {
    return (
      <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations realtimeProjection={undefined} />
      </section>
    );
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
      <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations
          error={{
            title: "IndexingStatus error",
            description: "Indexing Status is currently unavailable.",
          }}
        />
      </section>
    );
  }

  return <RecentRegistrations realtimeProjection={indexingStatus.realtimeProjection} />;
}
