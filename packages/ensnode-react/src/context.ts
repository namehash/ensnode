import { createContext } from "react";

import type { ENSNodeConfig } from "./types";

/**
 * React context for ENSNode configuration
 */
export const ENSNodeContext = createContext<ENSNodeConfig | undefined>(undefined);

/**
 * Display name for debugging
 */
ENSNodeContext.displayName = "ENSNodeContext";
