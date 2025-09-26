"use client";

import constate from "constate";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { useLocalstorageState } from "rooks";

import { validateENSNodeUrl } from "@/components/connections/ensnode-url-validator";
import { useHydrated } from "@/hooks/use-hydrated";
import { CONNECTION_PARAM_KEY, CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY } from "@/lib/constants";
import { defaultEnsNodeUrls } from "@/lib/env";
import { type UrlString, uniq } from "@ensnode/ensnode-sdk";

export interface ConnectionOption {
  url: UrlString;
  fromServerLibrary: boolean;
}

const normalizeUrl = (url: UrlString): UrlString => {
  try {
    return new URL(url).toString();
  } catch {
    // If URL parsing fails, try prefixing with https://
    return new URL(`https://${url}`).toString();
  }
};

const isValidUrl = (url: UrlString): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateAndNormalizeUrls = (urls: UrlString[]): UrlString[] => {
  return uniq(urls.filter(isValidUrl).map(normalizeUrl));
};

/**
 * Server connection library - ENSNode connection URLs provided by the server with guaranteed invariants:
 * - Each URL passes isValidUrl validation
 * - Each URL is in normalizeUrl form
 * - All URLs are unique (no duplicates)
 * - Contains at least 1 URL
 *
 * These invariants are maintained by:
 * 1. defaultEnsNodeUrls() already validates and ensures at least 1 URL
 * 2. Converting to string then normalizing ensures consistent format
 * 3. validateAndNormalizeUrls removes any potential duplicates and invalid URLs
 */
const serverConnectionLibrary = (() => {
  const rawUrls = defaultEnsNodeUrls().map((url) => url.toString());
  const validatedUrls = validateAndNormalizeUrls(rawUrls);

  // Guarantee at least 1 URL - this should never happen due to defaultEnsNodeUrls validation
  // but adding as a safety net to maintain the invariant
  if (validatedUrls.length === 0) {
    throw new Error("ServerConnectionLibrary must contain at least one valid URL");
  }

  return validatedUrls;
})();

function _useAvailableENSNodeConnections() {
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const currentConnection = searchParams.get(CONNECTION_PARAM_KEY);
  const [rawCustomConnectionUrls, storeCustomConnections] = useLocalstorageState<UrlString[]>(
    CUSTOM_CONNECTIONS_LOCAL_STORAGE_KEY,
    [],
  );

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
    const first = connectionLibrary[0].url;

    if (!currentConnection) return new URL(first);
    if (!isInConnections(currentConnection)) return new URL(first);
    return new URL(currentConnection);
  }, [hydrated, connectionLibrary, currentConnection, isInConnections]);

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
