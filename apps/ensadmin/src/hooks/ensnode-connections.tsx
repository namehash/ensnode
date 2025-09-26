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
  return uniq(urls.filter(isValidUrl).map(normalizeUrl));
};

/**
 * Default ENSNode connection URLs with guaranteed invariants:
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
const DEFAULT_CONNECTION_URLS = (() => {
  const rawUrls = defaultEnsNodeUrls().map((url) => url.toString());
  const validatedUrls = validateAndNormalizeUrls(rawUrls);

  // Guarantee at least 1 URL - this should never happen due to defaultEnsNodeUrls validation
  // but adding as a safety net to maintain the invariant
  if (validatedUrls.length === 0) {
    throw new Error("DEFAULT_CONNECTION_URLS must contain at least one valid URL");
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

  // Validate and normalize URLs from localStorage
  const customConnections = useMemo(() => {
    const validatedUrls = validateAndNormalizeUrls(rawCustomConnectionUrls);

    // Clean up localStorage if validation/normalization changed anything
    if (JSON.stringify(validatedUrls) !== JSON.stringify(rawCustomConnectionUrls)) {
      storeCustomConnections(validatedUrls);
    }

    return validatedUrls;
  }, [rawCustomConnectionUrls, storeCustomConnections]);

  const availableConnections = useMemo(
    () => [
      // include the default connections
      ...DEFAULT_CONNECTION_URLS.map((url) => ({ url, isDefault: true })),
      // include the user's connections that aren't already in defaults
      ...customConnections
        .filter((url) => !DEFAULT_CONNECTION_URLS.includes(url))
        .map((url) => ({ url, isDefault: false })),
    ],
    [customConnections],
  );

  const isInConnections = useMemo(
    () => (url: UrlString) => availableConnections.some((conn) => conn.url === url),
    [availableConnections],
  );

  const addCustomConnection = useCallback(
    async (_url: UrlString) => {
      const { isValid, error } = await validateENSNodeUrl(_url);
      if (!isValid) {
        throw new Error(error || "Invalid URL");
      }

      const url = normalizeUrl(_url);

      if (availableConnections.some((c) => c.url === url)) return url;

      storeCustomConnections((customConnections) => [...customConnections, url]);

      return url;
    },
    [availableConnections, storeCustomConnections],
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

  const addAndSelectCustomConnection = useCallback(
    async (url: UrlString) => {
      const added = await addCustomConnection(url);

      return added;
    },
    [addCustomConnection],
  );

  // the active connection is the current connection (from URL param) or the first default
  const active = useMemo<URL | null>(() => {
    // no active ensnode connection in server environments
    if (!hydrated) return null;

    // NOTE: guaranteed to have a valid set of `availableConnections` here, on the client
    // NOTE: guaranteed to have at least 1 connection because defaults must have length > 0
    const first = availableConnections[0].url;

    if (!currentConnection) return new URL(first);
    if (!isInConnections(currentConnection)) return new URL(first);
    return new URL(currentConnection);
  }, [hydrated, availableConnections, currentConnection, isInConnections]);

  return {
    availableConnections,
    active,
    addCustomConnection,
    addAndSelectCustomConnection,
    removeCustomConnection,
  };
}

const [AvailableENSNodeConnectionsProviderInner, useAvailableENSNodeConnections] = constate(
  _useAvailableENSNodeConnections,
);

export { useAvailableENSNodeConnections };

/**
 * Provider for available ENSNode connections (both default and custom).
 *
 * Wraps the inner provider with Suspense boundary to handle the async nature
 * of useSearchParams() which can suspend during SSR/hydration.
 *
 * Provides access to:
 * - availableConnections: All connections (default + custom)
 * - active: Currently active connection URL
 * - addCustomConnection: Add a new custom connection
 * - addAndSelectCustomConnection: Add and immediately select a custom connection
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
