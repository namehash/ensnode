import config from "@/config";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { canFallbackToTheGraph } from "@/lib/thegraph";

const logger = makeLogger("thegraph-fallback.middleware");

let didWarnCanFallback = false;

let didInitialShouldFallback = false;
let prevShouldFallback = false;

/**
 * Middleware that proxies Subgraph requests to thegraph if possible & necessary.
 */
export const thegraphFallbackMiddleware = factory.createMiddleware(async (c, next) => {
  const { canFallback, reason: cannotfallbackReason } = canFallbackToTheGraph(
    config.namespace,
    config.theGraphApiKey,
  );
  const isRealtime = c.var.isRealtime;

  // log one warning to the console if !canFallback
  if (!didWarnCanFallback && !canFallback) {
    switch (cannotfallbackReason) {
      case "no-api-key": {
        logger.warn(`ENSApi can NOT fall back to thegraph: THEGRAPH_API_KEY was not provided.`);
        break;
      }
      case "no-subgraph-url": {
        logger.warn(
          `ENSApi can NOT fall back to thegraph: the connected ENSIndexer's namespace ('${config.namespace}') is not supported by thegraph.`,
        );
        break;
      }
    }

    didWarnCanFallback = true;
  }

  ////////////////////////////////////////////////////////////
  // the Subgraph API falls back to thegraph for resolution if:
  //  a) canFallback (see `canFallbackToTheGraph`), and
  //  v) ENSIndexer is not realtime.
  ////////////////////////////////////////////////////////////
  const shouldFallback = canFallback && !isRealtime;

  // log notice when fallback begins
  if (
    (!didInitialShouldFallback && shouldFallback) || // first time
    (didInitialShouldFallback && !prevShouldFallback && shouldFallback) // future change in status
  ) {
    logger.warn(`ENSApi is falling back to thegraph for Subgraph API queries.`);
  }

  // log notice when fallback ends
  if (
    (!didInitialShouldFallback && !shouldFallback) || // first time
    (didInitialShouldFallback && prevShouldFallback && !shouldFallback) // future change in status
  ) {
    logger.info(`ENSApi is resolving Subgraph API queries.`);
  }

  prevShouldFallback = shouldFallback;
  didInitialShouldFallback = true;

  // if not falling back, proceed as normal
  if (!shouldFallback) return await next();

  // otherwise, perform thegraph proxy
  await next();
});
