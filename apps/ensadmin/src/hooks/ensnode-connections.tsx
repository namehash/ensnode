"use client";

import constate from "constate";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalstorageState } from "rooks";
import { toast } from "sonner";

import { validateENSNodeUrl } from "@/components/connections/ensnode-url-validator";
import { useHydrated } from "@/hooks/use-hydrated";
import { CONNECTION_PARAM_KEY, CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY } from "@/lib/constants";
import { getServerConnectionLibrary } from "@/lib/env";
import { isValidUrl, normalizeUrl } from "@/lib/url-utils";
import { type UrlString, uniq } from "@ensnode/ensnode-sdk";

export interface ConnectionOption {
  url: UrlString;
  fromServerLibrary: boolean;
}

const validateAndNormalizeUrls = (urls: UrlString[]): UrlString[] => {
  return uniq(urls.filter(isValidUrl).map(normalizeUrl));
};

/**
 * Server connection library - ENSNode connection URLs provided by the server with guaranteed invariants:
 * - Each URL passes validation (via getServerConnectionLibrary)
 * - Each URL is normalized (via getServerConnectionLibrary)
 * - All URLs are unique (via getServerConnectionLibrary)
 * - Contains at least 1 URL (via getServerConnectionLibrary)
 *
 * These invariants are maintained by getServerConnectionLibrary() which already validates,
 * normalizes, deduplicates, and ensures at least 1 URL exists.
 */
const serverConnectionLibrary = getServerConnectionLibrary().map((url) => url.toString());

function _useAvailableENSNodeConnections() {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSelectedConnection = searchParams.get(CONNECTION_PARAM_KEY);
  const [rawCustomConnectionUrls, storeCustomConnections] = useLocalstorageState<UrlString[]>(
    CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY,
    [],
  );

  const [existingConnectionUrl, setExistingConnectionUrl] = useState<UrlString | null>(null);
  const [failedConnectionUrls, setFailedConnections] = useState<Set<UrlString>>(new Set());

  // Validate and normalize URLs from localStorage - Custom Connection Library
  const customConnectionLibrary = useMemo(() => {
    const validatedUrls = validateAndNormalizeUrls(rawCustomConnectionUrls);

    // Clean up localStorage if validation/normalization changed anything
    if (JSON.stringify(validatedUrls) !== JSON.stringify(rawCustomConnectionUrls)) {
      storeCustomConnections(validatedUrls);
    }

    return validatedUrls;
  }, [rawCustomConnectionUrls, storeCustomConnections]);

  /**
   * Connection Library - dynamically generated union of ServerConnectionLibrary and CustomConnectionLibrary with guaranteed invariants:
   *
   * Format:
   * - Array of ConnectionOption objects with { url: UrlString, fromServerLibrary: boolean }
   * - url: Normalized URL string (via normalizeUrl())
   * - fromServerLibrary: true for server connections, false for custom ones
   *
   * Content guarantees:
   * - Always contains at least 1 connection (from serverConnectionLibrary)
   * - All URLs are valid (pass isValidUrl validation)
   * - All URLs are normalized to consistent format
   * - No duplicate URLs (custom connections filtered against server connections)
   * - Server connections always come first in array
   * - Custom connections are filtered to exclude any that match server connections
   *
   * Order:
   * 1. All server connections (fromServerLibrary: true)
   * 2. Custom connections not in server library (fromServerLibrary: false)
   */
  const connectionLibrary = useMemo<ConnectionOption[]>(
    () => [
      // include the server connections
      ...serverConnectionLibrary.map((url) => ({
        url,
        fromServerLibrary: true,
      })),
      // include the user's connections that aren't already in server library
      ...customConnectionLibrary
        .filter((url) => !serverConnectionLibrary.includes(url))
        .map((url) => ({ url, fromServerLibrary: false })),
    ],
    [customConnectionLibrary],
  );

  const isInConnections = useMemo(
    () => (url: UrlString) => connectionLibrary.some((conn) => conn.url === url),
    [connectionLibrary],
  );

  const addCustomConnection = useCallback(
    async (_url: UrlString) => {
      const { isValid, error } = await validateENSNodeUrl(_url);
      if (!isValid) {
        throw new Error(error || "Invalid URL");
      }

      const url = normalizeUrl(_url);

      if (connectionLibrary.some((c) => c.url === url)) return url;

      storeCustomConnections((customConnections) => [...customConnections, url]);

      return url;
    },
    [connectionLibrary, storeCustomConnections],
  );

  const removeCustomConnection = useCallback(
    (url: UrlString) => {
      storeCustomConnections((customConnections) =>
        customConnections.filter((_url) => _url !== url),
      );

      return url;
    },
    [storeCustomConnections],
  );

  // the selected connection is the current connection (from URL param) or the first from server library
  const selectedConnection = useMemo<URL | null>(() => {
    // no selected ensnode connection in server environments
    if (!hydrated) return null;

    // NOTE: guaranteed to have a valid set of `connectionLibrary` here, on the client
    // NOTE: guaranteed to have at least 1 connection because server library must have length > 0
    const defaultSelectedConnection = connectionLibrary[0].url;

    if (!rawSelectedConnection) return new URL(defaultSelectedConnection);
    if (!isInConnections(rawSelectedConnection)) return new URL(defaultSelectedConnection);
    return new URL(rawSelectedConnection);
  }, [hydrated, connectionLibrary, rawSelectedConnection, isInConnections]);

  const updateCurrentConnectionParam = useCallback(
    (url: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CONNECTION_PARAM_KEY, url);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Show connection success toast
  useEffect(() => {
    if (
      existingConnectionUrl !== null &&
      existingConnectionUrl !== rawSelectedConnection &&
      rawSelectedConnection
    ) {
      toast.success(`Connected to ${rawSelectedConnection}`);
    }

    setExistingConnectionUrl(rawSelectedConnection);
  }, [rawSelectedConnection, existingConnectionUrl]);

  // Handle URL parameter synchronization and connection loading
  useEffect(() => {
    if (!hydrated) return;
    if (!rawSelectedConnection) return;
    if (failedConnectionUrls.has(rawSelectedConnection)) return;

    // Check if connection URL already exists in connection library
    const existingConnection = connectionLibrary.find((conn) => conn.url === rawSelectedConnection);
    if (existingConnection) {
      return;
    }

    // Automatically add connection from URL parameter to library (enables shareable connection links)
    addCustomConnection(rawSelectedConnection)
      .then((addedUrl) => {
        updateCurrentConnectionParam(addedUrl);
        toast.success(`URL saved to connection library`);
        toast.success(`Connected to ${addedUrl}`);
      })
      .catch((error) => {
        toast.error(`Failed to connect: ${error.message}`);

        // Track this as a failed connection to prevent retry loop
        setFailedConnections((prev) => new Set(prev).add(rawSelectedConnection));

        // Remove invalid connection param from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete(CONNECTION_PARAM_KEY);
        router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname);
      });
  }, [
    hydrated,
    rawSelectedConnection,
    connectionLibrary,
    addCustomConnection,
    updateCurrentConnectionParam,
    failedConnectionUrls,
    searchParams,
    router,
  ]);

  // Handle URL parameter synchronization when no connection parameter exists
  useEffect(() => {
    if (!hydrated) return;
    if (rawSelectedConnection) return;

    // If no connection parameter exists and we have a selected connection, update URL
    if (selectedConnection) {
      updateCurrentConnectionParam(selectedConnection.toString());
    }
  }, [hydrated, rawSelectedConnection, selectedConnection, updateCurrentConnectionParam]);

  return {
    connectionLibrary,
    selectedConnection,
    addCustomConnection,
    removeCustomConnection,
  };
}

const [AvailableENSNodeConnectionsProviderInner, useAvailableENSNodeConnections] = constate(
  _useAvailableENSNodeConnections,
);

export { useAvailableENSNodeConnections };

/**
 * Provider for ENSNode connections (ServerConnectionLibrary + CustomConnectionLibrary).
 *
 * Wraps the inner provider with Suspense boundary to handle the async nature
 * of useSearchParams() which can suspend during SSR/hydration.
 *
 * Provides access to:
 * - connectionLibrary: All connections (server + custom)
 * - selectedConnection: Currently selected connection URL
 * - addCustomConnection: Add a new custom connection
 * - removeCustomConnection: Remove a custom connection
 */
export function AvailableENSNodeConnectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AvailableENSNodeConnectionsProviderInner>
        {children}
      </AvailableENSNodeConnectionsProviderInner>
    </Suspense>
  );
}
