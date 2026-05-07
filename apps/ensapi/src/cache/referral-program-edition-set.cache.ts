import config from "@/config";

import {
  buildReferralProgramEditionConfigSet,
  ENSReferralsClient,
  ReferralProgramAwardModels,
  type ReferralProgramEditionConfigSet,
} from "@namehash/ens-referrals";
import { minutesToSeconds } from "date-fns";

import { type CachedResult, SWRCache } from "@ensnode/ensnode-sdk";

import { lazyProxy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("referral-program-edition-set-cache");

/**
 * Returns `origin + pathname`, stripping any credentials or query params
 * so the URL is theoretically safer to include in log messages and error strings.
 */
function partiallyRedactUrl(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

/**
 * Loads the referral program edition config set from the configured URL.
 *
 * If no URL is configured, the referral program is treated as having zero configured editions
 * and no network or ENSDb work is performed.
 */
async function loadReferralProgramEditionConfigSet(
  _cachedResult?: CachedResult<ReferralProgramEditionConfigSet>,
): Promise<ReferralProgramEditionConfigSet> {
  // If no URL is configured, treat the referral program as having zero editions.
  if (!config.referralProgramEditionConfigSetUrl) {
    logger.info(
      "REFERRAL_PROGRAM_EDITIONS is not set; referral program edition config set is empty",
    );
    return buildReferralProgramEditionConfigSet([]);
  }

  const logSafeUrl = partiallyRedactUrl(config.referralProgramEditionConfigSetUrl);

  logger.info(`Loading referral program edition config set from: ${logSafeUrl}`);
  try {
    const editionConfigSet = await ENSReferralsClient.getReferralProgramEditionConfigSet(
      config.referralProgramEditionConfigSetUrl,
    );

    // Strip any unrecognized editions immediately — they are client-side forward-compatibility
    // placeholders that must never enter the server's operational config set (they can't be
    // serialized and would cause API handlers to crash).
    for (const [slug, editionConfig] of editionConfigSet) {
      if (editionConfig.rules.awardModel === ReferralProgramAwardModels.Unrecognized) {
        logger.warn(
          { editionSlug: slug, originalAwardModel: editionConfig.rules.originalAwardModel },
          `Skipping edition with unrecognized award model`,
        );
        editionConfigSet.delete(slug);
      }
    }

    logger.info(`Successfully loaded ${editionConfigSet.size} referral program editions`);
    return editionConfigSet;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(error, "Error occurred while loading referral program edition config set");
    throw new Error(
      `Failed to load referral program edition config set from ${logSafeUrl}: ${errorMessage}`,
    );
  }
}

type ReferralProgramEditionConfigSetCache = SWRCache<ReferralProgramEditionConfigSet>;

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
// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
export const referralProgramEditionConfigSetCache = lazyProxy<ReferralProgramEditionConfigSetCache>(
  () =>
    new SWRCache<ReferralProgramEditionConfigSet>({
      fn: loadReferralProgramEditionConfigSet,
      ttl: Number.POSITIVE_INFINITY,
      errorTtl: minutesToSeconds(1),
      proactiveRevalidationInterval: undefined,
      proactivelyInitialize: true,
    }),
);
