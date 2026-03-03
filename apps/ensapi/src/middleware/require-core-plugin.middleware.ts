import config from "@/config";

import { hasGraphqlApiConfigSupport, hasSubgraphApiConfigSupport } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

/**
 * Creates middleware that requires a specific core plugin to be enabled in ENSIndexer.
 *
 * Returns a 503 Service Unavailable response if the required prerequisite is not supported.
 *
 * @param core - The core plugin type to require ("subgraph" or "ensv2")
 * @returns Hono middleware that validates plugin availability
 */
export const requireCorePluginMiddleware = (core: "subgraph" | "ensv2") =>
  factory.createMiddleware(async (c, next) => {
    const subgraph = hasSubgraphApiConfigSupport(config.ensIndexerPublicConfig);
    if (core === "subgraph" && !subgraph.supported) {
      return c.text(`Service Unavailable: ${subgraph.reason}`, 503);
    }

    const graphql = hasGraphqlApiConfigSupport(config.ensIndexerPublicConfig);
    if (core === "ensv2" && !graphql.supported) {
      return c.text(`Service Unavailable: ${graphql.reason}`, 503);
    }

    await next();
  });
