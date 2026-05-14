"use client";

import { useContext } from "react";

import { EnsNodeContext } from "../context";
import type { EnsNodeProviderOptions } from "../types";

/**
 * Hook to access the {@link EnsNodeProviderOptions} from context or parameters.
 *
 * @param options - Options parameter that overrides context
 * @throws Error if no options are available in context or parameters
 */
export function useEnsNodeProviderOptions<
  ProviderOptionsType extends EnsNodeProviderOptions = EnsNodeProviderOptions,
>(options?: ProviderOptionsType): ProviderOptionsType {
  const contextOptions = useContext(EnsNodeContext);

  // Use provided options or fall back to context
  const resolvedOptions = options ?? contextOptions;

  if (!resolvedOptions) {
    throw new Error(
      "useEnsNodeProviderOptions must be used within an EnsNodeProvider or you must pass the options parameter",
    );
  }

  return resolvedOptions as ProviderOptionsType;
}
