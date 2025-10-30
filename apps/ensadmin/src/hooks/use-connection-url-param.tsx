import { useNavigate, useSearch } from "@tanstack/react-router";
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
   * Attaches the current raw connection URL param (if it exists) to the given
   * `basePath`.
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
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  // Get the current raw connection URL param
  const rawConnectionUrlParam =
    (search as Record<string, string>)[RAW_CONNECTION_PARAM_KEY] ?? null;

  // Build callback for setting the raw connection URL param
  const setRawConnectionUrlParam = useCallback(
    (rawUrl: string | null) => {
      const newSearch = { ...search } as Record<string, string | undefined>;

      if (rawUrl === null) {
        delete newSearch[RAW_CONNECTION_PARAM_KEY];
      } else {
        newSearch[RAW_CONNECTION_PARAM_KEY] = rawUrl;
      }

      navigate({
        search: newSearch,
        replace: true,
      });
    },
    [navigate, search],
  );

  // Build callback for attaching the current raw connection URL param
  // to the given `basePath`
  const retainCurrentRawConnectionUrlParam = useCallback(
    (basePath: string): string => {
      if (!rawConnectionUrlParam) {
        return basePath;
      }

      // Parse the basePath to extract pathname, search params, and hash
      const [pathAndQuery, hash] = basePath.split("#");
      const [pathname, queryString] = pathAndQuery.split("?");

      // Build URLSearchParams from existing query string
      const params = new URLSearchParams(queryString);
      params.set(RAW_CONNECTION_PARAM_KEY, rawConnectionUrlParam);

      // Reconstruct the path with updated params
      const pathWithRetainedConnection = `${pathname}?${params.toString()}${
        hash ? `#${hash}` : ""
      }`;

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
