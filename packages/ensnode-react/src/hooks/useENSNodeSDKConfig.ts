"use client";

import { useContext } from "react";

import { ENSNodeContext } from "../context";
import type { ENSNodeSDKConfig } from "../types";

/**
 * Hook to access the ENSNodeSDKConfig from context or parameters.
 *
 * @param parameters - Optional config parameter that overrides context
 * @returns The ENSNode configuration
 * @throws Error if no config is available in context or parameters
 */
export function useENSNodeSDKConfig<TConfig extends ENSNodeSDKConfig = ENSNodeSDKConfig>(
  config: TConfig | undefined,
): TConfig {
  const contextConfig = useContext(ENSNodeContext);

  // Use provided config or fall back to context
  const resolvedConfig = config ?? contextConfig;

  if (!resolvedConfig) {
    throw new Error(
      "useENSNodeSDKConfig must be used within an ENSNodeProvider or you must pass a config parameter",
    );
  }

  return resolvedConfig as TConfig;
}
