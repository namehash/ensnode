"use client";

import { createContext } from "react";

import type { ENSNodeSDKConfig } from "./types";

/**
 * React context for ENSNode configuration
 */
export const ENSNodeContext = createContext<ENSNodeSDKConfig | undefined>(undefined);

/**
 * Display name for debugging
 */
ENSNodeContext.displayName = "ENSNodeContext";
