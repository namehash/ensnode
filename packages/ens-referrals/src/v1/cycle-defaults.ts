import { mainnet } from "viem/chains";

import { priceUsdc, type UnixTimestamp } from "@ensnode/ensnode-sdk";

import {
  type ReferralProgramCycle,
  ReferralProgramCycleIds,
  type ReferralProgramCycleSet,
} from "./cycle";
import { buildReferralProgramRules } from "./rules";

/**
 * Configuration for Cycle 1: ENS Holiday Awards (December 2025)
 */
const CYCLE_1_CONFIG = {
  /**
   * Start date for the ENS Holiday Awards referral program.
   * 2025-12-01T00:00:00Z (December 1, 2025 at 00:00:00 UTC)
   */
  START_DATE: 1764547200 as UnixTimestamp,

  /**
   * End date for the ENS Holiday Awards referral program.
   * 2025-12-31T23:59:59Z (December 31, 2025 at 23:59:59 UTC)
   */
  END_DATE: 1767225599 as UnixTimestamp,

  /**
   * The maximum number of qualified referrers.
   */
  MAX_QUALIFIED_REFERRERS: 10,

  /**
   * The total value of the award pool in USDC.
   * 10,000 USDC = 10,000,000,000 (10_000 * 10^6 smallest units)
   */
  TOTAL_AWARD_POOL_VALUE: priceUsdc(10_000_000_000n),
} as const;

/**
 * Configuration for Cycle 2: March 2026
 */
const CYCLE_2_CONFIG = {
  /**
   * Start date for the March 2026 referral program.
   * 2026-03-01T00:00:00Z (March 1, 2026 at 00:00:00 UTC)
   */
  START_DATE: 1772524800 as UnixTimestamp,

  /**
   * End date for the March 2026 referral program.
   * 2026-03-31T23:59:59Z (March 31, 2026 at 23:59:59 UTC)
   */
  END_DATE: 1775116799 as UnixTimestamp,

  /**
   * The maximum number of qualified referrers.
   */
  MAX_QUALIFIED_REFERRERS: 10,

  /**
   * The total value of the award pool in USDC.
   * 10,000 USDC = 10,000,000,000 (10_000 * 10^6 smallest units)
   */
  TOTAL_AWARD_POOL_VALUE: priceUsdc(10_000_000_000n),
} as const;

/**
 * Returns the default referral program cycle set with pre-built cycle definitions.
 *
 * @param subregistryAddress - The subregistry address for rule validation (e.g., BaseRegistrar address)
 * @returns A map of cycle IDs to their pre-built cycle configurations
 */
export function getReferralProgramCycleSet(
  subregistryAddress: `0x${string}`,
): ReferralProgramCycleSet {
  const subregistryId = { chainId: mainnet.id, address: subregistryAddress };

  // Pre-built cycle-1 object (ENS Holiday Awards Dec 2025)
  const cycle1: ReferralProgramCycle = {
    id: ReferralProgramCycleIds.Cycle1,
    displayName: "ENS Holiday Awards",
    rules: buildReferralProgramRules(
      CYCLE_1_CONFIG.TOTAL_AWARD_POOL_VALUE,
      CYCLE_1_CONFIG.MAX_QUALIFIED_REFERRERS,
      CYCLE_1_CONFIG.START_DATE,
      CYCLE_1_CONFIG.END_DATE,
      subregistryId,
    ),
    rulesUrl: "https://ensawards.org/ens-holiday-awards-rules",
  };

  // Pre-built cycle-2 object (March 2026)
  const cycle2: ReferralProgramCycle = {
    id: ReferralProgramCycleIds.Cycle2,
    displayName: "March 2026",
    rules: buildReferralProgramRules(
      CYCLE_2_CONFIG.TOTAL_AWARD_POOL_VALUE,
      CYCLE_2_CONFIG.MAX_QUALIFIED_REFERRERS,
      CYCLE_2_CONFIG.START_DATE,
      CYCLE_2_CONFIG.END_DATE,
      subregistryId,
    ),
    rulesUrl: "https://ensawards.org/march-2026-rules",
  };

  return new Map([
    [ReferralProgramCycleIds.Cycle1, cycle1],
    [ReferralProgramCycleIds.Cycle2, cycle2],
  ]);
}
