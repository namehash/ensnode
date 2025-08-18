"use client";

import { useContext } from "react";
import { ENSNodeContext } from "../context";
import type { ENSNodeConfig } from "../types";

/**
 * Hook to access the ENSNode configuration from context or parameters
 *
 * @param parameters - Optional config parameter that overrides context
 * @returns The ENSNode configuration
 * @throws Error if no config is available in context or parameters
 */
export function useENSNodeConfig<TConfig extends ENSNodeConfig = ENSNodeConfig>(
  config: TConfig | undefined,
): TConfig {
  const contextConfig = useContext(ENSNodeContext);

  // Use provided config or fall back to context
  const resolvedConfig = config ?? contextConfig;

  if (!resolvedConfig) {
    throw new Error(
      "useENSNodeConfig must be used within an ENSNodeProvider or you must pass a config parameter",
    );
  }

  return resolvedConfig as TConfig;
}
