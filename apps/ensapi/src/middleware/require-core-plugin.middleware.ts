import { hasGraphqlApiConfigSupport, hasSubgraphApiConfigSupport } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";

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
    const { ensIndexerPublicConfig } = await publicConfigBuilder.getPublicConfig();

    const subgraph = hasSubgraphApiConfigSupport(ensIndexerPublicConfig);
    if (core === "subgraph" && !subgraph.supported) {
      return c.text(`Service Unavailable: ${subgraph.reason}`, 503);
    }

    const graphql = hasGraphqlApiConfigSupport(ensIndexerPublicConfig);
    if (core === "ensv2" && !graphql.supported) {
      return c.text(`Service Unavailable: ${graphql.reason}`, 503);
    }

    await next();
  });
