"use client";

import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";
import { IndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

import { RecentRegistrations } from "@/components/recent-registrations/components";

export function Registrations() {
  const ensIndexerConfigQuery = useENSIndexerConfig();
  const indexingStatusQuery = useIndexingStatus();

  if (ensIndexerConfigQuery.isError) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations
          error={{
            title: "ENSIndexerConfig error",
            description: ensIndexerConfigQuery.error.message,
          }}
        />
      </section>
    );
  }

  if (indexingStatusQuery.isError) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations
          error={{
            title: "IndexingStatus error",
            description: indexingStatusQuery.error.message,
          }}
        />
      </section>
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

  return (
    <section className="flex flex-col gap-6 p-6">
      <RecentRegistrations
        ensIndexerConfig={ensIndexerConfig}
        realtimeProjection={indexingStatus.realtimeProjection}
      />
    </section>
  );
}
