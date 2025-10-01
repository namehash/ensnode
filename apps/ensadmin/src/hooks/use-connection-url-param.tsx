"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// The query param key for the raw selected connection
const RAW_CONNECTION_PARAM_KEY = "connection";

interface UseRawConnectionUrlParamResult {
  /**
   * The current raw connection URL param, or null if param not present in current URL
   */
  rawConnectionUrlParam: string | null;

  /**
   * Sets the raw connection URL param in the browser URL.
   *
   * @param rawUrl - The raw connection URL to set in the browser URL, or `null` to
   *                 remove the param.
   */
  setRawConnectionUrlParam: (rawUrl: string | null) => void;

  /**
   * Attaches the current raw connection URL param (if it exists) to the given`basePath`.
   *
   * @param basePath - The base path to attach the current raw connection URL
   *                   param to. Must not contain any existing query parameters
   *                   (e.g. `?query=value`) or link fragment (e.g. `#anchor`).
   * @returns The `basePath` with the current raw connection URL param attached.
   */
  retainCurrentRawConnectionUrlParam: (basePath: string) => string;
}

/**
 * Hook for managing the raw connection URL param in the browser URL.
 *
 * This hook provides a centralized interface for all operations related to the
 * CONNECTION_PARAM_KEY URL parameter, ensuring consistent URL management across
 * the application.
 *
 * @returns A {UseRawConnectionUrlParamResult} object.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { rawConnectionUrlParam, setRawConnectionUrlParam } = useRawConnectionUrlParam();
 *
 *   // Read current connection URL from URL param
 *   console.log(rawConnectionUrlParam); // "https://api.example.com" or null
 *
 *   // Set raw connection URL param
 *   setRawConnectionUrlParam("https://api.example.com");
 * }
 * ```
 */
export function useRawConnectionUrlParam(): UseRawConnectionUrlParamResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the current raw connection URL param
  const rawConnectionUrlParam = searchParams.get(RAW_CONNECTION_PARAM_KEY);

  // Build callback for setting the raw connection URL param
  const setRawConnectionUrlParam = useCallback(
    (rawUrl: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (rawUrl === null) {
        params.delete(RAW_CONNECTION_PARAM_KEY);
      } else {
        params.set(RAW_CONNECTION_PARAM_KEY, rawUrl);
      }
      const paramString = params.toString();
      router.replace(paramString ? `?${paramString}` : "");
    },
    [router, searchParams],
  );

  // Build callback for attaching the current raw connection URL param
  // to the given `basePath`
  const retainCurrentRawConnectionUrlParam = useCallback(
    (basePath: string): string => {
      const pathWithRetainedConnection = rawConnectionUrlParam
        ? `${basePath}?${RAW_CONNECTION_PARAM_KEY}=${encodeURIComponent(rawConnectionUrlParam)}`
        : basePath;

      return pathWithRetainedConnection;
    },
    [rawConnectionUrlParam],
  );

  return {
    rawConnectionUrlParam,
    setRawConnectionUrlParam,
    retainCurrentRawConnectionUrlParam,
  };
}
