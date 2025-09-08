"use client";

import constate from "constate";
import { useCallback, useEffect, useMemo } from "react";
import { useLocalstorageState } from "rooks";

import { validateENSNodeUrl } from "@/components/connections/ensnode-url-validator";
import { useHydrated } from "@/hooks/use-hydrated";
import { defaultEnsNodeUrls } from "@/lib/env";
import { getTabId } from "@/lib/tab-utils";

// TODO: move to lib
const standardizeURL = (url: string) => new URL(url).toString();

const DEFAULT_CONNECTION_URLS = defaultEnsNodeUrls()
  .map((url) => url.toString())
  .map(standardizeURL);

function _useENSNodeConnections() {
  const hydrated = useHydrated();
  const tabId = useMemo(() => (hydrated ? getTabId() : "server"), [hydrated]);

  const [urls, setUrls] = useLocalstorageState<string[]>(`ensadmin:${tabId}:connections:urls`, []);

  const [selected, setSelected, clearSelected] = useLocalstorageState<string | null>(
    `ensadmin:${tabId}:connections:selected`,
    null,
  );

  const connections = useMemo(
    () => [
      // include the default connections
      ...DEFAULT_CONNECTION_URLS.map((url) => ({ url, isDefault: true })),
      // include the user's connections if
      ...urls.map((url) => ({ url, isDefault: false })),
    ],
    [urls],
  );

  const isInConnections = useMemo(
    () => (url: string) => connections.some((conn) => conn.url === url),
    [connections],
  );

  const addConnection = useCallback(
    async (_url: string) => {
      // validate the URL
      const { isValid, error } = await validateENSNodeUrl(_url);
      if (!isValid) {
        throw new Error(error || "Invalid URL");
      }

      const url = standardizeURL(_url);

      // check if URL already exists
      if (connections.some((c) => c.url === url)) return url;

      // add to set of urls
      setUrls((urls) => [...urls, url]);

      // return standardized value
      return url;
    },
    [connections, setUrls],
  );

  const removeConnection = useCallback(
    (url: string) => {
      // remove from set of urls
      setUrls((urls) => urls.filter((_url) => _url !== url));

      return url;
    },
    [setUrls],
  );

  const selectConnection = useCallback(
    (url: string) => {
      // must be in existing set of connections
      if (!isInConnections(url)) {
        throw new Error(`Cannot select URL not in list of connections: '${url}'.`);
      }

      return setSelected(url);
    },
    [isInConnections, setSelected],
  );

  const addAndSelectConnection = useCallback(
    async (url: string) => {
      const added = await addConnection(url);
      setSelected(added);
      return added;
    },
    [addConnection, setSelected],
  );

  // the active connection is the selected (if valid) or the first
  const active = useMemo<URL | null>(() => {
    // no active ensnode connection in server environments
    if (!hydrated) return null;

    // NOTE: guaranteed to have a valid set of `connections` here, on the client
    // NOTE: guaranteed to have at least 1 connection because defaults must have length > 0
    const first = connections[0].url;

    if (!selected) return new URL(first);
    if (!isInConnections(selected)) return new URL(first);
    return new URL(selected);
  }, [hydrated, connections, selected, isInConnections]);

  // clear selected if it is invalid
  useEffect(() => {
    if (selected && !isInConnections(selected)) {
      clearSelected();
    }
  }, [selected, isInConnections, clearSelected]);

  return {
    connections,
    active,
    addConnection,
    addAndSelectConnection,
    removeConnection,
    selectConnection,
  };
}

export const [ENSNodeConnectionsProvider, useENSNodeConnections] = constate(_useENSNodeConnections);
