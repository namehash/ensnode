import type { Address } from "viem";

import type { Duration, PriceEth } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema } from "@ensnode/ensnode-sdk/internal";

import { normalizeAddress, validateLowercaseAddress } from "./address";
import { validateNonNegativeInteger } from "./number";
import { ReferralProgramRules } from "./rules";
import { validateDuration } from "./time";

/**
 * Base metrics for a single referrer independent of other referrers and award model.
 * Used as input from the DB layer; does not carry an `awardModel` discriminant.
 */
export interface BaseReferrerMetrics {
  /**
   * The fully lowercase Ethereum address of the referrer.
   *
   * @invariant Guaranteed to be a valid EVM address in lowercase format
   */
  referrer: Address;

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
  referrer: Address,
  totalReferrals: number,
  totalIncrementalDuration: Duration,
  totalRevenueContribution: PriceEth,
): BaseReferrerMetrics => {
  const result = {
    referrer: normalizeAddress(referrer),
    totalReferrals,
    totalIncrementalDuration,
    totalRevenueContribution,
  } satisfies BaseReferrerMetrics;

  validateReferrerMetrics(result);
  return result;
};

export const validateReferrerMetrics = (metrics: BaseReferrerMetrics): void => {
  validateLowercaseAddress(metrics.referrer);
  validateNonNegativeInteger(metrics.totalReferrals);
  validateDuration(metrics.totalIncrementalDuration);

  const priceEthSchema = makePriceEthSchema("BaseReferrerMetrics.totalRevenueContribution");
  const parseResult = priceEthSchema.safeParse(metrics.totalRevenueContribution);
  if (!parseResult.success) {
    throw new Error(
      `BaseReferrerMetrics: totalRevenueContribution validation failed: ${parseResult.error.message}`,
    );
  }
};
