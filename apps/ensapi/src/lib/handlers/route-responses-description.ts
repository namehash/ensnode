import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ResultServer } from "@ensnode/ensnode-sdk";

import { resultCodeToHttpStatusCode } from "@/lib/result/result-into-http-response";

interface RouteDescription {
  description: string;
}

/**
 * Builds a mapping of HTTP status codes to route descriptions
 * from a mapping of operation result codes to route descriptions.
 *
 * @param routes - A record mapping operation result codes to route descriptions
 * @returns A record mapping HTTP status codes to route descriptions
 */
export function buildRouteResponsesDescription<TResult extends ResultServer>(
  routes: Record<TResult["resultCode"], RouteDescription>,
): Record<ContentfulStatusCode, RouteDescription> {
  return Object.entries(routes).reduce(
    (acc, entry) => {
      const [resultCode, desc] = entry as [TResult["resultCode"], RouteDescription];

      acc[resultCodeToHttpStatusCode(resultCode)] = desc;

      return acc;
    },
    {} as Record<ContentfulStatusCode, RouteDescription>,
  );
}
