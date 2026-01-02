"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface useClearUrlParamsProps {
  /**
   * A record of URL parameters and paths on which they are allowed.
   *
   * @example When parameter "name" is only allowed on path "/name" then
   * allowedParams={name: ["/name"]}
   */
  allowedParams: Record<string, string[]>;
}

/**
 * Clear URL params
 *
 * Scans the current URL and clears all parameters that are present outside their allowed paths.
 *
 * @throws Error if the hook is set up to clear the `connection` URL param.
 *
 * @example
 * allowedParams={name: ["/name"]}
 * Initial URL: https://admin.ensnode.io/name?name=lightwalker.eth&connection=https%3A%2F%2Fapi.alpha.ensnode.io%2F
 * URL after the hook: https://admin.ensnode.io/name?connection=https%3A%2F%2Fapi.alpha.ensnode.io%2F
 *
 * @example
 * allowedParams={name: ["/name"]}
 * Initial URL: https://admin.ensnode.io/name?example=lightwalker.eth&connection=https%3A%2F%2Fapi.alpha.ensnode.io%2F
 * URL after the hook: https://admin.ensnode.io/name?example=lightwalker.eth&connection=https%3A%2F%2Fapi.alpha.ensnode.io%2F
 *
 */
export function UseClearUrlParams({ allowedParams }: useClearUrlParamsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = usePathname();

  if (Object.keys(allowedParams).includes("connection"))
    throw new Error(
      `Invariant(useClearUrlParams): 'connection' parameter should not be edited by this hook`,
    );

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const paramsToRemove = [];

    // for each provided parameter
    for (const [param, allowedPaths] of Object.entries(allowedParams)) {
      // if we're not on a path where a param is allowed, and it's still present,
      // mark it as 'to be removed'
      if (!allowedPaths.includes(path) && searchParams.has(param)) {
        paramsToRemove.push(param);
      }
    }

    // Clear all parameters determined as 'to be removed'
    if (paramsToRemove.length > 0) {
      paramsToRemove.forEach((param) => currentParams.delete(param));

      // update the URL without changing history
      router.replace(`${path}?${currentParams}`);
    }
  }, [searchParams, path]);

  return null;
}
