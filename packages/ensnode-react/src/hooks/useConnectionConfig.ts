"use client";

import { useCallback } from "react";
import type { UseConnectionConfigParameters, UseConnectionConfigReturnType } from "../types";
import { useConnections } from "./useConnections";

/**
 * Hook for accessing the ENSIndexer Public Config of the current or specified connection
 *
 * This hook provides access to the configuration data fetched from an ENSNode endpoint,
 * which is separate from the client configuration used by the ENSNode SDK.
 *
 * @param parameters - Configuration for accessing connection config
 * @returns Connection configuration information
 *
 * @example
 * ```typescript
 * // Get config for current connection
 * const { config, isLoading, error } = useConnectionConfig();
 *
 * if (isLoading) return <div>Loading config...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (config) {
 *   console.log("Node name:", config.name);
 *   console.log("Supported chains:", config.chains);
 *   console.log("Features:", config.features);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Get config for a specific connection
 * const { config } = useConnectionConfig({
 *   url: "https://api.testnet.ensnode.io"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Use config to conditionally render features
 * const { config } = useConnectionConfig();
 *
 * return (
 *   <div>
 *     <h3>{config?.name || "ENSNode"}</h3>
 *     <p>{config?.description}</p>
 *
 *     {config?.chains && (
 *       <div>
 *         <h4>Supported Chains:</h4>
 *         {config.chains.map(chain => (
 *           <div key={chain.chainId}>
 *             {chain.name} (ID: {chain.chainId})
 *           </div>
 *         ))}
 *       </div>
 *     )}
 *
 *     {config?.features && (
 *       <div>
 *         <h4>Features:</h4>
 *         <ul>
 *           {config.features.map(feature => (
 *             <li key={feature}>{feature}</li>
 *           ))}
 *         </ul>
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useConnectionConfig(
  parameters: UseConnectionConfigParameters = {},
): UseConnectionConfigReturnType {
  const { url: targetUrl } = parameters;

  const { connections, currentUrl, isLoading: connectionsLoading } = useConnections();

  // Determine which URL to get config for
  const effectiveUrl = targetUrl || currentUrl;

  // Find the connection for the effective URL
  const connection = connections.find((conn) => conn.url === effectiveUrl);

  // Create a refetch function (for future use with query invalidation)
  const refetch = useCallback(() => {
    // For now, this doesn't do anything since we don't have a separate query
    // In the future, this could invalidate and refetch the connection config
    console.log("Refetching connection config for:", effectiveUrl);
  }, [effectiveUrl]);

  // Determine loading state
  const isLoading = connectionsLoading;

  // Determine error state
  const error =
    !connection && !connectionsLoading
      ? new Error(`Connection not found for URL: ${effectiveUrl}`)
      : null;

  return {
    config: connection?.config,
    isLoading,
    error,
    url: effectiveUrl,
    refetch,
  };
}
