"use client";

import { useContext } from "react";

import { EnsApiContext } from "../context";
import type { EnsApiProviderOptions } from "../types";

/**
 * Hook to access the EnsApiProviderOptions from context or parameters.
 *
 * @param config - Optional config parameter that overrides context
 * @returns The ENSNode configuration
 * @throws Error if no config is available in context or parameters
 */
export function useEnsApiProviderOptions<
  TConfig extends EnsApiProviderOptions = EnsApiProviderOptions,
>(config?: TConfig): TConfig {
  const contextConfig = useContext(EnsApiContext);

  // Use provided config or fall back to context
  const resolvedConfig = config ?? contextConfig;

  if (!resolvedConfig) {
    throw new Error(
      "useEnsApiProviderOptions must be used within an EnsApiProvider or you must pass a config parameter",
    );
  }

  return resolvedConfig as TConfig;
}
