"use client";

import { ErrorInfo } from "@/components/error-info";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

/**
 * Allows consumers to use `useActiveConnection` by blocking rendering until it is available.
 */
export function RequireActiveConnection({ children }: PropsWithChildren<{}>) {
  const { status, error } = useENSIndexerConfig();

  if (status === "pending") return null;

  if (status === "error") {
    return <ErrorInfo title="Unable to parse ENSNode Config" description={error.message} />;
  }

  return <>{children}</>;
}
