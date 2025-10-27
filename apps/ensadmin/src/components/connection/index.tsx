"use client";

import { use } from "react";

import { useENSNodeConfig } from "@ensnode/ensnode-react";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import { ensAdminVersion } from "@/lib/env";

const versionPromise = ensAdminVersion();

export default function ConnectionInfo() {
  const version = use(versionPromise);
  const { status, error, data } = useENSNodeConfig();

  if (status === "pending") {
    return (
      <section className="flex flex-col gap-6 p-6">
        <ENSNodeConfigInfo ensAdminVersion={version} />
      </section>
    );
  }

  if (status === "error") {
    return (
      <ENSNodeConfigInfo
        error={{
          title: "ENSNodeConfigInfo Error",
          description: error.message,
        }}
        ensAdminVersion={version}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      <ENSNodeConfigInfo ensApiPublicConfig={data} ensAdminVersion={version} />
    </section>
  );
}
