"use client";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import { ensAdminVersion } from "@/lib/env";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { Suspense, use } from "react";

const versionPromise = ensAdminVersion();

export default function ConnectionInfo() {
  const version = use(versionPromise);
  const ensIndexerConfigQuery = useENSIndexerConfig();

  if (ensIndexerConfigQuery.isError) {
    return (
      <ENSNodeConfigInfo
        error={{
          title: "ENSNodeConfigInfo Error",
          description: ensIndexerConfigQuery.error.message,
        }}
        ensAdminVersion={version}
      />
    );
  }

  if (!ensIndexerConfigQuery.isSuccess) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <ENSNodeConfigInfo ensAdminVersion={version} /> {/*display loading state*/}
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <ENSNodeConfigInfo ensIndexerConfig={ensIndexerConfig} ensAdminVersion={version} />
    </section>
  );
}
