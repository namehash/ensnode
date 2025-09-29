"use client";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

/**
 * Allows consumers to use `useActiveENSNodeConfig` by blocking rendering until it is available.
 */
export function RequireActiveENSNodeConfig({ children }: PropsWithChildren<{}>) {
  const { status, error } = useENSIndexerConfig();

  if (status === "pending") return null;

  if (status === "error") {
    return (
      <ENSNodeConfigInfo
        error={{
          title: "Unable to parse ENSNode Config",
          description: error.message,
        }}
      />
    );
  }

  return <>{children}</>;
}
