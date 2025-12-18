import config from "@/config";

import { proxy } from "hono/proxy";

import { canFallbackToTheGraph } from "@ensnode/ensnode-sdk/internal";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("thegraph-fallback.middleware");

let didWarnCanFallback = false;

let didInitialShouldFallback = false;
let prevShouldFallback = false;

/**
 * Middleware that proxies Subgraph requests to The Graph if possible & necessary.
 */
export const thegraphFallbackMiddleware = factory.createMiddleware(async (c, next) => {
  const isRealtime = c.var.isRealtime;

  // context must be set by the required middleware
  if (isRealtime === undefined) {
    throw new Error(`Invariant(thegraphFallbackMiddleware): isRealtimeMiddleware expected`);
  }

  const fallback = canFallbackToTheGraph({
    namespace: config.namespace,
    theGraphApiKey: config.theGraphApiKey,
    isSubgraphCompatible: config.ensIndexerPublicConfig.isSubgraphCompatible,
  });

  // log one warning to the console if !canFallback
  if (!didWarnCanFallback && !fallback.canFallback) {
    switch (fallback.reason) {
      case "not-subgraph-compatible": {
        logger.warn(
          `ENSApi can NOT fallback to The Graph: the connected ENSIndexer is not Subgraph Compatible and a fallback to The Graph would cause data inconsistency. ENSApi will continue internally handling Subgraph API queries regardless of realtime status.`,
        );
        break;
      }
      case "no-api-key": {
        logger.warn(`ENSApi can NOT fallback to The Graph: THEGRAPH_API_KEY was not provided.`);
        break;
      }
      case "no-subgraph-url": {
        logger.warn(
          `ENSApi can NOT fallback to The Graph: the connected ENSIndexer's namespace ('${config.namespace}') is not supported by The Graph.`,
        );
        break;
      }
    }

    didWarnCanFallback = true;
  }

  ////////////////////////////////////////////////////////////
  // ENSApi's Subgraph API falls back to The Graph for generating results if:
  //  a) canFallback (see `canFallbackToTheGraph`), and
  //  v) ENSIndexer is not sufficiently realtime.
  ////////////////////////////////////////////////////////////
  const shouldFallback = fallback.canFallback && !isRealtime;

  // log notice when fallback begins
  if (
    (!didInitialShouldFallback && shouldFallback) || // first time
    (didInitialShouldFallback && !prevShouldFallback && shouldFallback) // future change in status
  ) {
    logger.warn(`ENSApi is falling back to The Graph for Subgraph API queries.`);
  }

  // log notice when fallback ends
  if (
    (!didInitialShouldFallback && !shouldFallback) || // first time
    (didInitialShouldFallback && prevShouldFallback && !shouldFallback) // future change in status
  ) {
    logger.info(`ENSApi is internally handling Subgraph API queries.`);
  }

  prevShouldFallback = shouldFallback;
  didInitialShouldFallback = true;

  // if not falling back, proceed as normal
  if (!shouldFallback) return await next();

  // otherwise, proxy request to The Graph
  try {
    // https://hono.dev/docs/helpers/proxy
    return proxy(fallback.url, {
      // provide existing method/body
      method: c.req.method,
      body: await c.req.text(),
      // override headers to just provide Content-Type
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // if the request to The Graph fails for any reason, attempt to satisfy using ENSApi's
    // internally implemented subgraph api even if it is not sufficiently realtime
    logger.warn(error, `The Graph request failed, handling via Subgraph API anyway.`);
    return await next();
  }
});
