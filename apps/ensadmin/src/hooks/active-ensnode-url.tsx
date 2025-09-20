"use client";

import { defaultEnsNodeUrls } from "@/lib/env";
import { getConnectionFromParams } from "@/lib/url-params";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const DEFAULT_URL = defaultEnsNodeUrls()[0].toString();

export function useENSNodeConnection(): URL {
  const searchParams = useSearchParams();

  const connectionString = useMemo(() => {
    const activeConnection = getConnectionFromParams(searchParams);
    return activeConnection || DEFAULT_URL;
  }, [searchParams]);

  return useMemo(() => new URL(connectionString), [connectionString]);
}
