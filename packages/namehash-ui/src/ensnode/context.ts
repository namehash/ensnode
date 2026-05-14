import { createContext } from "react";

import type { EnsNodeProviderOptions } from "./types";

/**
 * React context for ENSNodeProvider options
 */
export const EnsNodeContext = createContext<EnsNodeProviderOptions | undefined>(undefined);

/**
 * Display name for debugging
 */
EnsNodeContext.displayName = "EnsNodeContext";
