import {
  initializeReferralEditionSnapshotsCaches,
  type ReferralEditionSnapshotsCacheMap,
} from "@/cache/referral-edition-snapshots.cache";
import { factory, producing } from "@/lib/hono-factory";
import type { referralProgramEditionConfigSetMiddleware } from "@/middleware/referral-program-edition-set.middleware";

/**
 * Type definition for the referral edition snapshots caches middleware context passed to downstream middleware and handlers.
 */
export type ReferralEditionSnapshotsCachesMiddlewareVariables = {
  /**
   * A map from edition slug to its dedicated {@link SWRCache} containing a {@link ReferralEditionSnapshot}.
   *
   * Returns an {@link Error} if the referral program edition config set failed to load.
   *
   * When the map is available, each edition has its own independent cache. Therefore, each edition's cache
   * can be asynchronously loaded / refreshed from others, and a failure to
   * load data for one edition doesn't break data successfully loaded
   * for other editions.
   *
   * When reading from a specific edition's cache, it will return either:
   * - The {@link ReferralEditionSnapshot} if successfully cached
   * - An {@link Error} if the cache failed to build
   *
   * Individual edition caches maintain their own stale-while-revalidate behavior, so a previously
   * successfully fetched edition continues serving its data even if a subsequent refresh fails.
   */
  referralEditionSnapshotsCaches: ReferralEditionSnapshotsCacheMap | Error;
};

/**
 * Middleware that provides {@link ReferralEditionSnapshotsCachesMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware depends on {@link referralProgramEditionConfigSetMiddleware} to provide
 * the edition config set. If the edition config set failed to load, this middleware propagates the error.
 * Otherwise, it initializes caches for each edition in the config set.
 *
 * Each cache's builder function handles immutability internally - when an edition becomes immutably
 * closed (past the safety window), the builder returns previously cached data without re-fetching.
 */
export const referralEditionSnapshotsCachesMiddleware = producing(
  ["referralEditionSnapshotsCaches"],
  factory.createMiddleware(async (c, next) => {
    const editionConfigSet = c.get("referralProgramEditionConfigSet");

    // Invariant: referralProgramEditionConfigSetMiddleware must be applied before this middleware
    if (editionConfigSet === undefined) {
      throw new Error(
        "Invariant(referralEditionSnapshotsCachesMiddleware): referralProgramEditionConfigSetMiddleware required",
      );
    }

    // If edition config set loading failed, propagate the error
    if (editionConfigSet instanceof Error) {
      c.set("referralEditionSnapshotsCaches", editionConfigSet);
      await next();
      return;
    }

    // Initialize caches for the edition config set
    const caches = initializeReferralEditionSnapshotsCaches(editionConfigSet);
    c.set("referralEditionSnapshotsCaches", caches);
    await next();
  }),
);
