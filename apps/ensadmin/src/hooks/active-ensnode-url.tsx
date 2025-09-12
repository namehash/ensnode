"use client";

import { defaultEnsNodeUrls } from "@/lib/env";
import { getActiveConnectionFromParams } from "@/lib/url-params";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const DEFAULT_URL = defaultEnsNodeUrls()[0].toString();

export function useActiveENSNodeUrl(): URL {
  const searchParams = useSearchParams();

  const urlString = useMemo(() => {
    const activeConnection = getActiveConnectionFromParams(searchParams);
    return activeConnection || DEFAULT_URL;
  }, [searchParams]);

  return useMemo(() => new URL(urlString), [urlString]);
}
