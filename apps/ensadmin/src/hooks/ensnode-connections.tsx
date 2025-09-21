"use client";

import constate from "constate";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useLocalstorageState } from "rooks";

import { validateENSNodeUrl } from "@/components/connections/ensnode-url-validator";
import { useHydrated } from "@/hooks/use-hydrated";
import { defaultEnsNodeUrls } from "@/lib/env";
import type { UrlString } from "@ensnode/ensnode-sdk";

const normalizeUrl = (url: UrlString): UrlString => new URL(url).toString();

const isValidUrl = (url: UrlString): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateAndNormalizeUrls = (urls: UrlString[]): UrlString[] => {
  return urls
    .filter(isValidUrl)
    .map(normalizeUrl)
    .filter((url, index, array) => array.indexOf(url) === index); // remove duplicates
};

const DEFAULT_CONNECTION_URLS = defaultEnsNodeUrls()
  .map((url) => url.toString())
  .map(normalizeUrl);

const CONNECTION_PARAM_KEY = "connection";

function _useENSNodeConnections() {
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const currentConnection = searchParams.get(CONNECTION_PARAM_KEY);
  const [rawCustomConnectionUrls, storeCustomConnections] = useLocalstorageState<UrlString[]>(
    "ensadmin:connections:urls",
    [],
  );

  // Validate and normalize URLs from localStorage
  const customConnections = useMemo(() => {
    const validatedUrls = validateAndNormalizeUrls(rawCustomConnectionUrls);

    // Clean up localStorage if we found invalid URLs
    if (validatedUrls.length !== rawCustomConnectionUrls.length) {
      storeCustomConnections(validatedUrls);
    }

    return validatedUrls;
  }, [rawCustomConnectionUrls, storeCustomConnections]);

  const connections = useMemo(
    () => [
      // include the default connections
      ...DEFAULT_CONNECTION_URLS.map((url) => ({ url, isDefault: true })),
      // include the user's connections if
      ...customConnections.map((url) => ({ url, isDefault: false })),
    ],
    [customConnections],
  );

  const isInConnections = useMemo(
    () => (url: UrlString) => connections.some((conn) => conn.url === url),
    [connections],
  );

  const addConnection = useCallback(
    async (_url: UrlString) => {
      const { isValid, error } = await validateENSNodeUrl(_url);
      if (!isValid) {
        throw new Error(error || "Invalid URL");
      }

      const url = normalizeUrl(_url);

      if (connections.some((c) => c.url === url)) return url;

      storeCustomConnections((customConnections) => [...customConnections, url]);

      return url;
    },
    [connections, storeCustomConnections],
  );

  const removeConnection = useCallback(
    (url: UrlString) => {
      storeCustomConnections((customConnections) =>
        customConnections.filter((_url) => _url !== url),
      );

      return url;
    },
    [storeCustomConnections],
  );

  const addAndSelectConnection = useCallback(
    async (url: UrlString) => {
      const added = await addConnection(url);

      return added;
    },
    [addConnection],
  );

  // the active connection is the current connection (from URL param) or the first default
  const active = useMemo<URL | null>(() => {
    // no active ensnode connection in server environments
    if (!hydrated) return null;

    // NOTE: guaranteed to have a valid set of `connections` here, on the client
    // NOTE: guaranteed to have at least 1 connection because defaults must have length > 0
    const first = connections[0].url;

    if (!currentConnection) return new URL(first);
    if (!isInConnections(currentConnection)) return new URL(first);
    return new URL(currentConnection);
  }, [hydrated, connections, currentConnection, isInConnections]);

  return {
    connections,
    active,
    addConnection,
    addAndSelectConnection,
    removeConnection,
  };
}

export const [ENSNodeConnectionsProvider, useENSNodeConnections] = constate(_useENSNodeConnections);
