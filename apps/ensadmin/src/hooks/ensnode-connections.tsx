"use client";

import { validateConnection } from "@/components/connections/ensnode-url-validator";
import { defaultEnsNodeUrls } from "@/lib/env";
import {
  buildPathnameWithParams,
  getConnectionFromParams,
  setSelectedConnectionInParams,
} from "@/lib/url-params";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useLocalstorageState } from "rooks";

const normalizeURL = (url: string) => new URL(url).toString();

const DEFAULT_CONNECTION_URLS = defaultEnsNodeUrls()
  .map((url) => url.toString())
  .map(normalizeURL);

export function useENSNodeConnections() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [urls, setUrls] = useLocalstorageState<string[]>(`ensadmin:connections:urls`, []);

  const connections = useMemo(
    () => [
      ...DEFAULT_CONNECTION_URLS.map((url) => ({ url, isDefault: true })),
      ...urls.map((url) => ({ url, isDefault: false })),
    ],
    [urls],
  );

  const addConnection = useCallback(
    async (_url: string) => {
      const { isValid, error } = await validateConnection(_url);
      if (!isValid) {
        throw new Error(error || "Invalid URL");
      }

      const url = normalizeURL(_url);
      if (connections.some((c) => c.url === url)) return url;

      setUrls((urls) => [...urls, url]);
      return url;
    },
    [connections, setUrls],
  );

  const removeConnection = useCallback(
    (url: string) => {
      setUrls((urls) => urls.filter((_url) => _url !== url));
    },
    [setUrls],
  );

  const selectConnection = useCallback(
    (url: string) => {
      const params = setSelectedConnectionInParams(
        new URLSearchParams(window.location.search),
        url,
      );
      const newUrl = buildPathnameWithParams(pathname, params);
      router.push(newUrl);
    },
    [pathname, router],
  );

  const addAndSelectConnection = useCallback(
    async (url: string) => {
      const added = await addConnection(url);
      selectConnection(added);
      return added;
    },
    [addConnection, selectConnection],
  );

  useEffect(() => {
    const activeConnectionUrl = getConnectionFromParams(searchParams);

    if (activeConnectionUrl) {
      try {
        const standardizedUrl = normalizeURL(activeConnectionUrl);
        const isAlreadyInConnections = connections.some((c) => c.url === standardizedUrl);

        if (!isAlreadyInConnections) {
          setUrls((urls) => [...urls, standardizedUrl]);
        }
      } catch {}
    }
  }, [searchParams, connections, setUrls]);

  return {
    connections,
    addConnection,
    addAndSelectConnection,
    removeConnection,
    selectConnection,
  };
}
