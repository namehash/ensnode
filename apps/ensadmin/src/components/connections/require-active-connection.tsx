"use client";

import type { PropsWithChildren } from "react";

import { useEnsApiConfig } from "@/components/config/useEnsApiConfig";
import { ErrorInfo } from "@/components/error-info";
import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * Allows consumers to use `useActiveConnection` by blocking rendering until it is available.
 */
export function RequireActiveConnection({ children }: PropsWithChildren) {
  const ensApiConfig = useEnsApiConfig();

  if (ensApiConfig.status === "pending") return <Loading />;

  if (ensApiConfig.status === "error") {
    return (
      <section className="p-6">
        <ErrorInfo title="Failed to connect to ENSApi" description={ensApiConfig.error.message} />
      </section>
    );
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
