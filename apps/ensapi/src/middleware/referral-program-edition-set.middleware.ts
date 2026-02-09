import type { ReferralProgramEditionConfigSet } from "@namehash/ens-referrals/v1";

import { referralProgramEditionConfigSetCache } from "@/cache/referral-program-edition-set.cache";
import { factory } from "@/lib/hono-factory";

/**
 * Type definition for the referral program edition config set middleware context.
 */
export type ReferralProgramEditionConfigSetMiddlewareVariables = {
  /**
   * The referral program edition config set loaded either from a custom URL or defaults.
   *
   * - On success: {@link ReferralProgramEditionConfigSet} - A Map of edition slugs to edition configurations
   * - On failure: {@link Error} - An error that occurred during loading
   */
  referralProgramEditionConfigSet: ReferralProgramEditionConfigSet | Error;
};

/**
 * Middleware that provides {@link ReferralProgramEditionConfigSetMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware reads the referral program edition config set from the SWR cache.
 * The cache is initialized once at startup and, if successful, never revalidated, ensuring
 * the edition config set JSON is only fetched once during the application lifecycle.
 *
 * If the cache fails to load, the JSON fetching will be retried on subsequent requests.
 */
export const referralProgramEditionConfigSetMiddleware = factory.createMiddleware(
  async (c, next) => {
    const editionConfigSet = await referralProgramEditionConfigSetCache.read();
    c.set("referralProgramEditionConfigSet", editionConfigSet);
    await next();
  },
);
