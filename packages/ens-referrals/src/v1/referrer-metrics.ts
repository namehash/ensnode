import type { Duration, NormalizedAddress } from "enssdk";

import type { PriceEth } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema } from "@ensnode/ensnode-sdk/internal";

import { validateAddress } from "./address";
import { validateNonNegativeInteger } from "./number";
import { ReferralProgramRules } from "./rules";
import { validateDuration } from "./time";

/**
 * Metrics for a single referrer, as aggregated from the DB layer.
 * Independent of other referrers and award model; does not carry an `awardModel` discriminant.
 */
export interface ReferrerMetrics {
  /**
   * The Ethereum address of the referrer, as a {@link NormalizedAddress}.
   */
  referrer: NormalizedAddress;

  /**
   * The total number of referrals made by the referrer within the {@link ReferralProgramRules}.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  totalReferrals: number;

  /**
   * The total incremental duration (in seconds) of all referrals made by the referrer within
   * the {@link ReferralProgramRules}.
   */
  totalIncrementalDuration: Duration;

  /**
   * The total revenue contribution in ETH made to the ENS DAO by all referrals
   * from this referrer.
   *
   * This is the sum of the total cost paid by registrants for all registrar actions
   * where this address was the referrer.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   * @invariant Never null (records with null `total` in the database are treated as 0 when summing)
   */
  totalRevenueContribution: PriceEth;
}

export const buildReferrerMetrics = (
  referrer: NormalizedAddress,
  totalReferrals: number,
  totalIncrementalDuration: Duration,
  totalRevenueContribution: PriceEth,
): ReferrerMetrics => {
  const result = {
    referrer,
    totalReferrals,
    totalIncrementalDuration,
    totalRevenueContribution,
  } satisfies ReferrerMetrics;

  validateReferrerMetrics(result);
  return result;
};

export const validateReferrerMetrics = (metrics: ReferrerMetrics): void => {
  validateAddress(metrics.referrer);
  validateNonNegativeInteger(metrics.totalReferrals);
  validateDuration(metrics.totalIncrementalDuration);

  makePriceEthSchema("ReferrerMetrics.totalRevenueContribution").parse(
    metrics.totalRevenueContribution,
  );
};
