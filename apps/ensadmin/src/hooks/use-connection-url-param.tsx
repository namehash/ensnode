"use client";

import { type UrlString } from "@ensnode/ensnode-sdk";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// This value is the query param key for the active
// connection used in the URL state manager
export const CONNECTION_PARAM_KEY = "connection";

interface UseConnectionUrlParamReturn {
  /** The current connection URL from the URL parameter, or null if not present */
  currentConnectionUrl: string | null;
  /** Sets the connection URL parameter in the browser URL */
  setConnectionUrl: (url: UrlString) => void;
}

/**
 * Custom hook for managing the connection URL parameter in the browser URL.
 *
 * This hook provides a centralized interface for all operations related to the
 * CONNECTION_PARAM_KEY URL parameter, ensuring consistent URL management across
 * the application.
 *
 * @returns {UseConnectionUrlParamReturn} Object containing URL parameter management functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentConnectionUrl, setConnectionUrl } = useConnectionUrlParam();
 *
 *   // Read current connection URL from URL parameter
 *   console.log(currentConnectionUrl); // "https://api.example.com" or null
 *
 *   // Set connection URL parameter
 *   setConnectionUrl("https://api.example.com");
 * }
 * ```
 */
export function useConnectionUrlParam(): UseConnectionUrlParamReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the current connection URL from the URL parameter
  const currentConnectionUrl = searchParams.get(CONNECTION_PARAM_KEY);

  // Set the connection URL parameter
  const setConnectionUrl = useCallback(
    (url: UrlString) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CONNECTION_PARAM_KEY, url);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return {
    currentConnectionUrl,
    setConnectionUrl,
  };
}
