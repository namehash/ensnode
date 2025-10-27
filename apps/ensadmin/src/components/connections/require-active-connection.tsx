"use client";

import type { PropsWithChildren } from "react";

import { useENSNodeConfigQuery } from "@ensnode/ensnode-react";

import { ErrorInfo } from "@/components/error-info";
import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * Allows consumers to use `useActiveConnection` by blocking rendering until it is available.
 */
export function RequireActiveConnection({ children }: PropsWithChildren) {
  const { status, error } = useENSNodeConfigQuery();

  if (status === "pending") return <Loading />;

  if (status === "error") {
    return <ErrorInfo title="Unable to parse ENSNode Config" description={error.message} />;
  }

  return children;
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner className="h-32 w-32" />
    </div>
  );
}
