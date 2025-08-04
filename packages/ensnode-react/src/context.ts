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

/**
 * Interface for connection context state
 */
export interface ConnectionContextState {
  /** Currently active connection URL */
  currentUrl: string;
  /** Function to switch to a different connection URL */
  setCurrentUrl: (url: string) => void;
  /** Whether connection management is enabled */
  isConnectionManaged: boolean;
}

/**
 * React context for connection management
 */
export const ConnectionContext = createContext<ConnectionContextState | undefined>(undefined);

/**
 * Display name for debugging
 */
ConnectionContext.displayName = "ConnectionContext";
