"use client";

import { RecentRegistrations } from "@/components/recent-registrations/components";
import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";
import { IndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

export function Registrations() {
  const ensIndexerConfigQuery = useENSIndexerConfig();
  const indexingStatusQuery = useIndexingStatus();

  if (ensIndexerConfigQuery.isError) {
    return (
      <RecentRegistrations
        error={{
          title: "ENSIndexerConfig error",
          description: ensIndexerConfigQuery.error.message,
        }}
      />
    );
  }

  if (indexingStatusQuery.isError) {
    return (
      <RecentRegistrations
        error={{ title: "IndexingStatus error", description: indexingStatusQuery.error.message }}
      />
    );
  }

  if (!ensIndexerConfigQuery.isSuccess || !indexingStatusQuery.isSuccess) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations ensIndexerConfig={undefined} realtimeProjection={undefined} />{" "}
        {/*display loading state*/}
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

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

  return (
    <section className="flex flex-col gap-6 p-6">
      <RecentRegistrations
        ensIndexerConfig={ensIndexerConfig}
        realtimeProjection={indexingStatus.realtimeProjection}
      />
    </section>
  );
}
