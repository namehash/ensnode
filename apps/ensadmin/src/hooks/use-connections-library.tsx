"use client";

import constate from "constate";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalstorageState } from "rooks";
import { toast } from "sonner";

import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { useHydrated } from "@/hooks/use-hydrated";
import { getServerConnectionLibrary } from "@/lib/env";
import {
  BuildHttpHostnameResult,
  HttpHostname,
  buildHttpHostname,
  buildHttpHostnames,
} from "@/lib/url-utils";
import { uniq } from "@ensnode/ensnode-sdk";

const CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY = "ensadmin:custom-connections:urls";

export type ConnectionOptionType = "server" | "custom";

export interface ConnectionOption {
  url: HttpHostname;
  type: ConnectionOptionType;
}

export interface SelectedConnectionResult {
  /**
   * The raw value for the selected connection.
   *
   * Useful for displaying error messages in the UI if this value is invalid.
   */
  rawSelectedConnection: string;

  /**
   * Holds the result of building a `HttpHostname` from `rawSelectedConnection`.
   */
  validatedSelectedConnection: BuildHttpHostnameResult;
}

/**
 * Invariants:
 * - At least 1 connection
 * - All connections are (naively) deduplicated
 */
const serverConnectionLibrary = getServerConnectionLibrary();
const defaultSelectedConnection = serverConnectionLibrary[0];

function _useConnectionsLibrary() {
  const hydrated = useHydrated();
  const { rawConnectionUrlParam, setRawConnectionUrlParam } = useRawConnectionUrlParam();

  // get raw custom connection library URLs from localStorage
  const [rawCustomConnectionUrls, storeRawCustomConnectionUrls] = useLocalstorageState<string[]>(
    CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY,
    [],
  );

  const [rawExistingConnectionUrl, setRawExistingConnectionUrl] = useState<string | null>(null);

  /**
   * Invariants:
   * - 0 or more connections
   * - All connections are (naively) deduplicated
   */
  const customConnectionLibrary: HttpHostname[] = useMemo(() => {
    const connections = buildHttpHostnames(rawCustomConnectionUrls);

    // naive deduplication
    const uniqueConnections = uniq(connections);

    return uniqueConnections;
  }, [rawCustomConnectionUrls]);

  // clean up custom connection library URLs in localStorage if validation changed anything
  useEffect(() => {
    if (JSON.stringify(customConnectionLibrary) !== JSON.stringify(rawCustomConnectionUrls)) {
      storeRawCustomConnectionUrls(customConnectionLibrary.map((url) => url.toString()));
    }
  }, [customConnectionLibrary, rawCustomConnectionUrls, storeRawCustomConnectionUrls]);

  /**
   * Invariants:
   * - At least 1 connection
   * - All connections are (naively) deduplicated
   *   - All connections from the server connection library are guaranteed in the result
   *   - All connections from the custom connection library that are not in the server
   *     connection library are guaranteed in the result
   * - All connections are in the order they are defined in the server connection library
   *   followed by the order they are defined in the custom connection library.
   */
  const connectionLibrary = useMemo<ConnectionOption[]>(
    () => [
      // first, include all records from the server connection library
      ...serverConnectionLibrary.map((url) => ({
        url,
        type: "server" as const,
      })),
      // then include all records from the user's custom connection library
      // that aren't already in the server connection library
      ...customConnectionLibrary
        .filter((url) => !serverConnectionLibrary.includes(url))
        .map((url) => ({ url, type: "custom" as const })),
    ],
    [customConnectionLibrary],
  );

  const addCustomConnection = useCallback(
    (url: HttpHostname) => {
      storeRawCustomConnectionUrls((customConnections) => {
        // naive deduplication
        return uniq([...customConnections, url.toString()]);
      });

      return url;
    },
    [storeRawCustomConnectionUrls],
  );

  const removeCustomConnection = useCallback(
    (url: HttpHostname) => {
      storeRawCustomConnectionUrls((customConnections) =>
        customConnections.filter((rawUrl) => rawUrl !== url.toString()),
      );

      return url;
    },
    [storeRawCustomConnectionUrls],
  );

  const selectedConnection = useMemo<SelectedConnectionResult | null>(() => {
    // no selected ensnode connection in server environments
    if (!hydrated) return null;
    if (!rawConnectionUrlParam) return null;
    return {
      rawSelectedConnection: rawConnectionUrlParam,
      validatedSelectedConnection: buildHttpHostname(rawConnectionUrlParam),
    };
  }, [hydrated, rawConnectionUrlParam]);

  // Automatically (and explicitly) select the default selected connection
  // if no connection has been selected yet.
  useEffect(() => {
    if (hydrated && !rawConnectionUrlParam) {
      setRawConnectionUrlParam(defaultSelectedConnection.toString());
    }
  }, [hydrated, rawConnectionUrlParam, setRawConnectionUrlParam]);

  // Show connection selected toast
  useEffect(() => {
    if (
      rawExistingConnectionUrl !== null &&
      rawConnectionUrlParam !== null &&
      rawExistingConnectionUrl.toString() !== rawConnectionUrlParam
    ) {
      toast.success(`Selected connection to ${rawConnectionUrlParam}`);
    }

    setRawExistingConnectionUrl(rawConnectionUrlParam);
  }, [rawConnectionUrlParam, rawExistingConnectionUrl]);

  const selectConnection = useCallback(
    (url: HttpHostname) => {
      setRawConnectionUrlParam(url.toString());
    },
    [setRawConnectionUrlParam],
  );

  return {
    connectionLibrary,
    selectedConnection,
    addCustomConnection,
    removeCustomConnection,
    selectConnection,
  };
}

const [ConnectionsLibraryProviderInner, useConnectionsLibrary] = constate(_useConnectionsLibrary);

export { useConnectionsLibrary };

/**
 * Provider for Connections Library management.
 *
 * Wraps the inner provider with Suspense boundary to handle the async nature
 * of useSearchParams() which can suspend during SSR/hydration.
 *
 * Provides access to:
 * - connectionLibrary: List of 1 or more `ConnectionOption` values
 *   (includes both `server` and `custom` `ConnectionOptionType`)
 * - selectedConnection: Currently selected connection as a
 *   `SelectedConnectionResult` or `null` if no connection is selected.
 * - addCustomConnection: Callback for adding a new custom connection
 * - removeCustomConnection: Callback for removing a custom connection
 * - selectConnection: Callback for selecting a connection
 */
export function ConnectionsLibraryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ConnectionsLibraryProviderInner>{children}</ConnectionsLibraryProviderInner>
    </Suspense>
  );
}
