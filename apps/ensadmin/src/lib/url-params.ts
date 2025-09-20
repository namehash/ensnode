import { ReadonlyURLSearchParams } from "next/navigation";

const ACTIVE_CONNECTION_PARAM = "connection";

/**
 * Retrieves the active connection URL from URL search parameters.
 *
 * @param searchParams - The URL search parameters to read from
 * @returns The connection URL string if present, otherwise null
 */
export const getConnectionFromParams = (
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): string | null => {
  return searchParams.get(ACTIVE_CONNECTION_PARAM);
};

/**
 * Sets the active connection URL in URL search parameters.
 *
 * @param searchParams - The existing URL search parameters
 * @param connection - The connection URL string to set
 * @returns A new URLSearchParams instance with the connection parameter set
 */
export const getConectionInUrlParams = (
  searchParams: URLSearchParams,
  connection: string,
): URLSearchParams => {
  const params = new URLSearchParams(searchParams);

  params.set(ACTIVE_CONNECTION_PARAM, connection);

  return params;
};

/**
 * Builds a pathname with query string parameters appended.
 *
 * @param pathname - The base pathname (e.g., "/status")
 * @param searchParams - The URL search parameters to append
 * @returns The pathname with query string if parameters exist, otherwise just the pathname
 * @example
 * ```typescript
 * buildPathnameWithParams("/status", new URLSearchParams("connection=..."))
 * // Returns: "/status?connection=..."
 *
 * buildPathnameWithParams("/status", new URLSearchParams())
 * // Returns: "/status"
 * ```
 */
export const buildPathnameWithParams = (
  pathname: string,
  searchParams: URLSearchParams,
): string => {
  const params = searchParams.toString();

  return params ? `${pathname}?${params}` : pathname;
};
