"use client";

import { RecentRegistrations } from "@/components/recent-registrations/components";
import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";

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
        <RecentRegistrations />
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <RecentRegistrations ensIndexerConfig={ensIndexerConfig} indexingStatus={indexingStatus} />
    </section>
  );
}
