"use client";

import { useContext } from "react";
import { ENSNodeContext } from "../context";
import type { ConfigParameter, ENSNodeConfig } from "../types";

/**
 * Hook to access the ENSNode configuration from context or parameters
 *
 * @param parameters - Optional config parameter that overrides context
 * @returns The ENSNode configuration
 * @throws Error if no config is available in context or parameters
 */
export function useENSNodeConfig<TConfig extends ENSNodeConfig = ENSNodeConfig>(
  parameters: ConfigParameter<TConfig> = {},
): TConfig {
  const contextConfig = useContext(ENSNodeContext);
  const { config } = parameters;

  // Use provided config or fall back to context
  const finalConfig = config ?? contextConfig;

  if (!finalConfig) {
    throw new Error(
      "useENSNodeConfig must be used within an ENSNodeProvider or you must pass a config parameter",
    );
  }

  return finalConfig as TConfig;
}
