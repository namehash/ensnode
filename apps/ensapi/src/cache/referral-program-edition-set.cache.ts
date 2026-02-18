import config from "@/config";

import {
  ENSReferralsClient,
  getDefaultReferralProgramEditionConfigSet,
  type ReferralProgramEditionConfigSet,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import { type CachedResult, SWRCache } from "@ensnode/ensnode-sdk";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("referral-program-edition-set-cache");

/**
 * Loads the referral program edition config set from custom URL or defaults.
 */
async function loadReferralProgramEditionConfigSet(
  _cachedResult?: CachedResult<ReferralProgramEditionConfigSet>,
): Promise<ReferralProgramEditionConfigSet> {
  // Check if custom URL is configured
  if (config.customReferralProgramEditionConfigSetUrl) {
    logger.info(
      `Loading custom referral program edition config set from: ${config.customReferralProgramEditionConfigSetUrl.href}`,
    );
    try {
      const editionConfigSet = await ENSReferralsClient.getReferralProgramEditionConfigSet(
        config.customReferralProgramEditionConfigSetUrl,
      );
      logger.info(`Successfully loaded ${editionConfigSet.size} custom referral program editions`);
      return editionConfigSet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(error, "Error occurred while loading referral program edition config set");
      throw new Error(
        `Failed to load custom referral program edition config set from ${config.customReferralProgramEditionConfigSetUrl.href}: ${errorMessage}`,
      );
    }
  }

  // Use default edition config set for the namespace
  logger.info(
    `Loading default referral program edition config set for namespace: ${config.namespace}`,
  );
  const editionConfigSet = getDefaultReferralProgramEditionConfigSet(config.namespace);
  logger.info(`Successfully loaded ${editionConfigSet.size} default referral program editions`);
  return editionConfigSet;
}

/**
 * SWR Cache for the referral program edition config set.
 *
 * Once successfully loaded, the edition config set is cached indefinitely and never revalidated.
 * This ensures the JSON is only fetched once during the application lifecycle.
 *
 * Configuration:
 * - ttl: Infinity - Never expires once cached
 * - proactiveRevalidationInterval: undefined - No proactive revalidation
 * - proactivelyInitialize: true - Load immediately on startup
 */
export const referralProgramEditionConfigSetCache = new SWRCache<ReferralProgramEditionConfigSet>({
  fn: loadReferralProgramEditionConfigSet,
  ttl: Number.POSITIVE_INFINITY,
  errorTtl: minutesToSeconds(1),
  proactiveRevalidationInterval: undefined,
  proactivelyInitialize: true,
});
