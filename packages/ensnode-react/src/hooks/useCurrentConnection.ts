"use client";

import { useCallback, useContext, useMemo } from "react";
import { ENSNodeContext } from "../context";
import type { ENSNodeConfig } from "../types";

/**
 * Parameters for the useCurrentConnection hook
 */
export interface UseCurrentConnectionParameters {
  /** Override the current connection URL */
  url?: string | URL;
}

/**
 * Return type for the useCurrentConnection hook
 */
export interface UseCurrentConnectionReturnType {
  /** The current connection URL as a string */
  url: string;
  /** The current connection URL as a URL object */
  urlObject: URL;
  /** The current ENSNode configuration */
  config: ENSNodeConfig;
  /** Function to create a new config with a different URL */
  createConfigWithUrl: (newUrl: string | URL) => ENSNodeConfig;
}

/**
 * Hook for accessing and managing the current ENSNode connection
 *
 * This hook provides access to the current connection URL and configuration,
 * and utilities for creating new configurations with different URLs.
 *
 * @param parameters - Configuration for the current connection
 * @returns Current connection information and utilities
 *
 * @example
 * ```typescript
 * const { url, config, createConfigWithUrl } = useCurrentConnection();
 *
 * console.log("Current URL:", url);
 *
 * // Create a new config for a different endpoint
 * const testnetConfig = createConfigWithUrl("https://api.testnet.ensnode.io");
 * ```
 *
 * @example
 * ```typescript
 * // Override the current connection
 * const { url, config } = useCurrentConnection({
 *   url: "https://my-custom-node.com"
 * });
 * ```
 */
export function useCurrentConnection(
  parameters: UseCurrentConnectionParameters = {}
): UseCurrentConnectionReturnType {
  const { url: overrideUrl } = parameters;
  const contextConfig = useContext(ENSNodeContext);

  if (!contextConfig) {
    throw new Error(
      "useCurrentConnection must be used within an ENSNodeProvider"
    );
  }

  // Determine the current URL
  const currentUrl = useMemo(() => {
    if (overrideUrl) {
      return typeof overrideUrl === "string" ? overrideUrl : overrideUrl.toString();
    }
    return contextConfig.client.endpointUrl.toString();
  }, [overrideUrl, contextConfig.client.endpointUrl]);

  // Create URL object
  const urlObject = useMemo(() => {
    return new URL(currentUrl);
  }, [currentUrl]);

  // Current config (potentially with overridden URL)
  const config = useMemo((): ENSNodeConfig => {
    if (overrideUrl) {
      return {
        client: {
          ...contextConfig.client,
          endpointUrl: urlObject,
        },
      };
    }
    return contextConfig;
  }, [overrideUrl, contextConfig, urlObject]);

  // Function to create a new config with a different URL
  const createConfigWithUrl = useCallback(
    (newUrl: string | URL): ENSNodeConfig => {
      const newUrlObject = new URL(newUrl);
      return {
        client: {
          ...contextConfig.client,
          endpointUrl: newUrlObject,
        },
      };
    },
    [contextConfig.client]
  );

  return {
    url: currentUrl,
    urlObject,
    config,
    createConfigWithUrl,
  };
}
