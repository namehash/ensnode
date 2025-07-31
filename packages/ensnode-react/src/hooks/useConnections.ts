"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type {
  AddConnectionVariables,
  Connection,
  RemoveConnectionVariables,
  UseConnectionsParameters,
  UseConnectionsReturnType,
} from "../types";
import { defaultValidator } from "../utils/validator";

const DEFAULT_STORAGE_KEY = "ensnode:connections:urls";

/**
 * Hook for managing ENSNode connections
 * Provides functionality to list, add, remove, and switch between ENSNode endpoints
 *
 * @param parameters - Configuration for connection management
 * @returns Connection management utilities
 *
 * @example
 * ```typescript
 * // Basic usage with default validator
 * const {
 *   connections,
 *   currentUrl,
 *   setCurrentUrl,
 *   addConnection,
 *   removeConnection
 * } = useConnections({
 *   selectedUrl: "https://api.mainnet.ensnode.io",
 *   defaultUrls: ["https://api.mainnet.ensnode.io", "https://api.testnet.ensnode.io"]
 * });
 *
 * // Usage with custom validator
 * const customValidator = {
 *   async validate(url: string) {
 *     // Custom validation logic here
 *     if (!url.includes("ensnode")) {
 *       return { isValid: false, error: "Must be an ENSNode endpoint" };
 *     }
 *     // Check if endpoint is reachable
 *     try {
 *       const response = await fetch(`${url}/health`);
 *       return { isValid: response.ok };
 *     } catch {
 *       return { isValid: false, error: "Endpoint is not reachable" };
 *     }
 *   }
 * };
 *
 * const { addConnection: addValidatedConnection } = useConnections({
 *   validator: customValidator,
 *   defaultUrls: ["https://api.mainnet.ensnode.io"]
 * });
 *
 * // Add a new connection (will use custom validator)
 * await addConnection.mutateAsync({ url: "https://my-custom-node.com" });
 *
 * // Switch to a different connection
 * setCurrentUrl("https://api.testnet.ensnode.io");
 *
 * // Remove a custom connection
 * await removeConnection.mutateAsync({ url: "https://my-custom-node.com" });
 * ```
 */
export function useConnections(
  parameters: UseConnectionsParameters = {},
): UseConnectionsReturnType {
  const {
    selectedUrl,
    defaultUrls = [],
    storageKey = DEFAULT_STORAGE_KEY,
    validator = defaultValidator,
  } = parameters;

  const queryClient = useQueryClient();

  // State for current URL
  const [currentUrl, setCurrentUrlState] = useState(() => {
    if (selectedUrl) {
      return typeof selectedUrl === "string" ? selectedUrl : selectedUrl.toString();
    }
    return defaultUrls.length > 0
      ? typeof defaultUrls[0] === "string"
        ? defaultUrls[0]
        : defaultUrls[0].toString()
      : "";
  });

  // Convert default URLs to connections
  const defaultConnections: Connection[] = defaultUrls.map((url) => ({
    url: typeof url === "string" ? url : url.toString(),
    isDefault: true,
  }));

  /**
   * Load connections from localStorage and merge with defaults
   */
  const loadConnections = useCallback((): Connection[] => {
    let connections: Connection[];

    try {
      const savedUrlsRaw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      const savedUrls = savedUrlsRaw ? JSON.parse(savedUrlsRaw) : [];

      const savedConnections: Connection[] = savedUrls
        .filter((savedUrl: string) =>
          // Filter out saved URLs that are already in defaults
          defaultConnections.every((defaultConn) => defaultConn.url !== savedUrl),
        )
        .map((url: string) => ({
          url,
          isDefault: false,
        }));

      connections = [...defaultConnections, ...savedConnections];
    } catch {
      connections = defaultConnections;
    }

    return connections;
  }, [defaultConnections, storageKey]);

  /**
   * Save custom connections to localStorage
   */
  const saveConnections = useCallback(
    (connections: Connection[]) => {
      const customUrls = connections.filter((c) => !c.isDefault).map((c) => c.url);

      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(customUrls));
      }
    },
    [storageKey],
  );

  // Query for loading connections
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["ensnode-connections", storageKey],
    queryFn: loadConnections,
    // Enable this query only in the browser
    enabled: typeof window !== "undefined",
  });

  // Mutation for adding a connection
  const addConnection = useMutation({
    mutationFn: async ({ url }: AddConnectionVariables) => {
      // Validate the URL
      const validationResult = await validator.validate(url);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || "Invalid URL");
      }

      // Check if URL already exists
      if (connections.some((c) => c.url === url)) {
        throw new Error("Connection already exists");
      }

      // Add new connection
      const newConnections = [...connections, { url, isDefault: false }];
      saveConnections(newConnections);

      return { url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ensnode-connections"] });
    },
  });

  // Mutation for removing a connection
  const removeConnection = useMutation({
    mutationFn: async ({ url }: RemoveConnectionVariables) => {
      // Check if trying to remove a connection that exists
      const connection = connections.find((c) => c.url === url);
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Prevent removing default connections
      if (connection.isDefault) {
        throw new Error("Cannot remove default connection");
      }

      // Remove connection
      const newConnections = connections.filter((c) => c.url !== url);
      saveConnections(newConnections);

      return { url };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ensnode-connections"] });

      // If the removed connection was currently selected, switch to the first available
      if (data.url === currentUrl && connections.length > 1) {
        const remainingConnections = connections.filter((c) => c.url !== data.url);
        if (remainingConnections.length > 0) {
          setCurrentUrlState(remainingConnections[0].url);
        }
      }
    },
  });

  // Function to update current URL
  const setCurrentUrl = useCallback((url: string) => {
    setCurrentUrlState(url);
  }, []);

  return {
    connections,
    isLoading,
    currentUrl,
    setCurrentUrl,
    addConnection: {
      mutate: addConnection.mutate,
      mutateAsync: addConnection.mutateAsync,
      isPending: addConnection.isPending,
      isError: addConnection.isError,
      error: addConnection.error,
      reset: addConnection.reset,
    },
    removeConnection: {
      mutate: removeConnection.mutate,
      mutateAsync: removeConnection.mutateAsync,
      isPending: removeConnection.isPending,
      isError: removeConnection.isError,
      error: removeConnection.error,
      reset: removeConnection.reset,
    },
  };
}
