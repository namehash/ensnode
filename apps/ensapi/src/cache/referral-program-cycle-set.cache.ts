import config from "@/config";

import {
  ENSReferralsClient,
  getDefaultReferralProgramCycleConfigSet,
  type ReferralProgramCycleConfigSet,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import { SWRCache } from "@ensnode/ensnode-sdk";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("referral-program-cycle-set-cache");

/**
 * Loads the referral program cycle config set from custom URL or defaults.
 */
async function loadReferralProgramCycleConfigSet(): Promise<ReferralProgramCycleConfigSet> {
  // Check if custom URL is configured
  if (config.customReferralProgramCycleConfigSetUrl) {
    logger.info(
      `Loading custom referral program cycle config set from: ${config.customReferralProgramCycleConfigSetUrl.href}`,
    );
    try {
      const cycleConfigSet = await ENSReferralsClient.getReferralProgramCycleConfigSet(
        config.customReferralProgramCycleConfigSetUrl,
      );
      logger.info(`Successfully loaded ${cycleConfigSet.size} custom referral program cycles`);
      return cycleConfigSet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load custom referral program cycle config set from ${config.customReferralProgramCycleConfigSetUrl.href}: ${errorMessage}`,
      );
    }
  }

  // Use default cycle config set for the namespace
  logger.info(
    `Loading default referral program cycle config set for namespace: ${config.namespace}`,
  );
  const cycleConfigSet = getDefaultReferralProgramCycleConfigSet(config.namespace);
  logger.info(`Successfully loaded ${cycleConfigSet.size} default referral program cycles`);
  return cycleConfigSet;
}

/**
 * SWR Cache for the referral program cycle config set.
 *
 * Once successfully loaded, the cycle config set is cached indefinitely and never revalidated.
 * This ensures the JSON is only fetched once during the application lifecycle.
 *
 * Configuration:
 * - ttl: Infinity - Never expires once cached
 * - proactiveRevalidationInterval: undefined - No proactive revalidation
 * - proactivelyInitialize: true - Load immediately on startup
 */
export const referralProgramCycleConfigSetCache = new SWRCache<ReferralProgramCycleConfigSet>({
  fn: async () => {
    try {
      const cycleConfigSet = await loadReferralProgramCycleConfigSet();
      logger.info("Referral program cycle config set cached successfully");
      return cycleConfigSet;
    } catch (error) {
      logger.error(
        error,
        "Error occurred while loading referral program cycle config set. The cache will remain empty.",
      );
      throw error;
    }
  },
  ttl: Number.POSITIVE_INFINITY,
  errorTtl: minutesToSeconds(1),
  proactiveRevalidationInterval: undefined,
  proactivelyInitialize: true,
});
