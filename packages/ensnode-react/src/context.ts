import { createContext } from "react";

import type { EnsApiProviderOptions } from "./types";

/**
 * React context for ENSApi configuration
 */
export const EnsApiContext = createContext<EnsApiProviderOptions | undefined>(undefined);

/**
 * Display name for debugging
 */
EnsApiContext.displayName = "EnsApiContext";
