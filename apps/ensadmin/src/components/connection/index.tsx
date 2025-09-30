"use client";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";

//TODO: Would appreciate advice about the naming convention here,
// since @/app/connection/page.tsx already has a component named "Connection"
export default function ConnectionInfo() {
  const ensIndexerConfigQuery = useENSIndexerConfig();

  if (ensIndexerConfigQuery.isError) {
    return (
      <ENSNodeConfigInfo
        error={{
          title: "ENSNodeConfigInfo Error",
          description: ensIndexerConfigQuery.error.message,
        }}
      />
    );
  }

  if (!ensIndexerConfigQuery.isSuccess) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <ENSNodeConfigInfo /> {/*display loading state*/}
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <ENSNodeConfigInfo ensIndexerConfig={ensIndexerConfig} />
    </section>
  );
}
