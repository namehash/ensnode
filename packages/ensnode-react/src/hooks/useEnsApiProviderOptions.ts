"use client";

import { useContext } from "react";

import { EnsApiContext } from "../context";
import type { EnsApiProviderOptions } from "../types";

/**
 * Hook to access the EnsApiProviderOptions from context or parameters.
 *
 * @param options - Options parameter that overrides context
 * @throws Error if no config is available in context or parameters
 */
export function useEnsApiProviderOptions<
  ProviderOptionsType extends EnsApiProviderOptions = EnsApiProviderOptions,
>(options?: ProviderOptionsType): ProviderOptionsType {
  const contextOptions = useContext(EnsApiContext);

  // Use provided options or fall back to context
  const resolvedOptions = options ?? contextOptions;

  if (!resolvedOptions) {
    throw new Error(
      "useEnsApiProviderOptions must be used within an EnsApiProvider or you must pass the options parameter",
    );
  }

  return resolvedOptions as ProviderOptionsType;
}
