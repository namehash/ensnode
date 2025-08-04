"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useState } from "react";
import { ConnectionContext } from "../context";
import type {
  AddConnectionVariables,
  Connection,
  ENSIndexerPublicConfig,
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
  const connectionContext = useContext(ConnectionContext);

  // State for current URL
  const [currentUrl, setCurrentUrlState] = useState(() => {
    // If we have connection context, use its current URL
    if (connectionContext?.isConnectionManaged) {
      return connectionContext.currentUrl;
    }
    if (selectedUrl) {
      return typeof selectedUrl === "string" ? selectedUrl : selectedUrl.toString();
    }
    return defaultUrls.length > 0
      ? typeof defaultUrls[0] === "string"
        ? defaultUrls[0]
        : defaultUrls[0].toString()
      : "";
  });

  // Sync with connection context when connection management is enabled
  useEffect(() => {
    if (connectionContext?.isConnectionManaged) {
      setCurrentUrlState(connectionContext.currentUrl);
    }
  }, [connectionContext?.currentUrl, connectionContext?.isConnectionManaged]);

  // Convert default URLs to connections
  const defaultConnections: Connection[] = defaultUrls.map((url) => ({
    url: typeof url === "string" ? url : url.toString(),
    isDefault: true,
    config: undefined, // Default connections don't have config initially
  }));

  /**
   * Load connections from localStorage and merge with defaults
   */
  const loadConnections = useCallback((): Connection[] => {
    let connections: Connection[];

    try {
      const savedConnectionsRaw =
        typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      const savedConnections = savedConnectionsRaw ? JSON.parse(savedConnectionsRaw) : [];

      const customConnections: Connection[] = savedConnections
        .filter((savedConn: Connection) =>
          // Filter out saved URLs that are already in defaults
          defaultConnections.every((defaultConn) => defaultConn.url !== savedConn.url),
        )
        .map((savedConn: Connection) => ({
          url: savedConn.url,
          isDefault: false,
          config: savedConn.config,
        }));

      connections = [...defaultConnections, ...customConnections];
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
      const customConnections = connections.filter((c) => !c.isDefault);

      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(customConnections));
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
      // Validate the URL and fetch config
      const validationResult = await validator.validate(url);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || "Invalid URL");
      }

      // Check if URL already exists
      if (connections.some((c) => c.url === url)) {
        throw new Error("Connection already exists");
      }

      // Add new connection with config
      const newConnections = [
        ...connections,
        {
          url,
          isDefault: false,
          config: validationResult.config,
        },
      ];
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
  const setCurrentUrl = useCallback(
    (url: string) => {
      setCurrentUrlState(url);
      // If connection management is enabled, also update the context
      if (connectionContext?.isConnectionManaged) {
        connectionContext.setCurrentUrl(url);
      }
    },
    [setCurrentUrlState, connectionContext],
  );

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
