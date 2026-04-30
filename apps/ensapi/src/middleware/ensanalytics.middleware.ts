import config from "@/config";

import {
  hasEnsAnalyticsConfigSupport,
  hasEnsAnalyticsIndexingStatusSupport,
} from "@namehash/ens-referrals";

import type { PrerequisiteResult } from "@ensnode/ensnode-sdk";

import { factory, producing } from "@/lib/hono-factory";

/**
 * Type definition for the ENSAnalytics prerequisites middleware context passed
 * to downstream middleware and handlers.
 */
export type EnsAnalyticsPrerequisitesMiddlewareVariables = {
  /**
   * Result of checking the ENSAnalytics API's runtime prerequisites:
   * - The connected ENSIndexer has all required plugins active.
   * - ENSApi has a valid indexing status cached.
   * - The cached indexing status is "following" or "completed".
   *
   * `{ supported: true }` means all prerequisites are met and the request can be served.
   * `{ supported: false, reason }` means at least one prerequisite failed; handlers should
   * short-circuit with a 503 in their endpoint-specific response shape, surfacing the
   * `reason` string verbatim to clients.
   */
  ensAnalyticsPrerequisites: PrerequisiteResult;
};

/**
 * ENSAnalytics API Middleware
 *
 * Computes the ENSAnalytics API's runtime prerequisites and exposes the result
 * to handlers via `c.var.ensAnalyticsPrerequisites`. Does NOT short-circuit the
 * request — each handler reads the result and produces a 503 in its own
 * response-union shape.
 *
 * Sets `{ supported: false, reason }` for any of the following:
 * 1) Not all required plugins are active in the connected ENSIndexer
 *    configuration.
 * 2) ENSApi has not yet successfully cached the Indexing Status in memory from
 *    the connected ENSIndexer.
 * 3) The omnichain indexing status of the connected ENSIndexer that is cached
 *    in memory is not "completed" or "following".
 */
export const ensanalyticsApiMiddleware = producing(
  ["ensAnalyticsPrerequisites"],
  factory.createMiddleware(async function ensanalyticsApiMiddleware(c, next) {
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(ensanalytics.middleware): indexingStatusMiddleware required`);
    }

    const configSupport = hasEnsAnalyticsConfigSupport(config.ensIndexerPublicConfig);
    if (!configSupport.supported) {
      c.set("ensAnalyticsPrerequisites", configSupport);
      return await next();
    }

    if (c.var.indexingStatus instanceof Error) {
      c.set("ensAnalyticsPrerequisites", {
        supported: false,
        reason: `Indexing status is currently unavailable to this ENSApi instance.`,
      });
      return await next();
    }

    const { omnichainSnapshot } = c.var.indexingStatus.snapshot;
    const indexingStatusSupport = hasEnsAnalyticsIndexingStatusSupport(
      omnichainSnapshot.omnichainStatus,
    );
    if (!indexingStatusSupport.supported) {
      c.set("ensAnalyticsPrerequisites", indexingStatusSupport);
      return await next();
    }

    c.set("ensAnalyticsPrerequisites", { supported: true });
    await next();
  }),
);
