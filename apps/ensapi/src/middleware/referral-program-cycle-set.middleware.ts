import type { ReferralProgramCycleConfigSet } from "@namehash/ens-referrals/v1";

import { referralProgramCycleConfigSetCache } from "@/cache/referral-program-cycle-set.cache";
import { factory } from "@/lib/hono-factory";

/**
 * Type definition for the referral program cycle config set middleware context.
 */
export type ReferralProgramCycleConfigSetMiddlewareVariables = {
  /**
   * The referral program cycle config set loaded either from a custom URL or defaults.
   *
   * - On success: {@link ReferralProgramCycleConfigSet} - A Map of cycle slugs to cycle configurations
   * - On failure: {@link Error} - An error that occurred during loading
   */
  referralProgramCycleConfigSet: ReferralProgramCycleConfigSet | Error;
};

/**
 * Middleware that provides {@link ReferralProgramCycleConfigSetMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware reads the referral program cycle config set from the SWR cache.
 * The cache is initialized once at startup and never revalidated, ensuring
 * the cycle config set JSON is only fetched once during the application lifecycle.
 */
export const referralProgramCycleConfigSetMiddleware = factory.createMiddleware(async (c, next) => {
  const cycleConfigSet = await referralProgramCycleConfigSetCache.read();
  c.set("referralProgramCycleConfigSet", cycleConfigSet);
  await next();
});
