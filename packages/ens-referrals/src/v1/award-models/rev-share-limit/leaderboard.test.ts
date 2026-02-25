import { describe, expect, it } from "vitest";

import { parseTimestamp, parseUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";

import { SECONDS_PER_YEAR } from "../../time";
import { buildReferrerLeaderboardRevShareLimit } from "./leaderboard";
import type { ReferralEvent } from "./referral-event";
import { buildReferralProgramRulesRevShareLimit } from "./rules";

// ─── Test fixtures ───────────────────────────────────────────────────────────

const ADDR_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const ADDR_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
const ADDR_C = "0xcccccccccccccccccccccccccccccccccccccccc" as const;

const TX_1 = "0x0000000000000000000000000000000000000000000000000000000000000001" as const;
const TX_2 = "0x0000000000000000000000000000000000000000000000000000000000000002" as const;
const TX_3 = "0x0000000000000000000000000000000000000000000000000000000000000003" as const;

const ZERO_ETH = priceEth(0n);

/**
 * Build test rules.
 *
 * - BASE_REVENUE_CONTRIBUTION_PER_YEAR = $5 USDC
 * - qualifiedRevenueShare = 0.5
 * - 1 year of duration → $5 base revenue → $2.50 standard award
 * - minQualifiedRevenueContribution = $5 → need exactly 1 year to qualify
 *
 * @param totalAwardPoolValue - USDC amount for the pool (default: $1000)
 * @param minQualifiedRevenueContribution - USDC threshold (default: $5 = 1 year)
 */
function buildTestRules(
  totalAwardPoolValue = parseUsdc("1000"),
  minQualifiedRevenueContribution = parseUsdc("5"),
) {
  return buildReferralProgramRulesRevShareLimit(
    totalAwardPoolValue,
    minQualifiedRevenueContribution,
    0.5, // qualifiedRevenueShare
    parseTimestamp("2026-01-01T00:00:00Z"),
    parseTimestamp("2026-12-31T23:59:59Z"),
    { chainId: 1, address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" },
    new URL("https://example.com/rules"),
  );
}

/**
 * Build a ReferralEvent with sensible defaults.
 */
let eventIdCounter = 0;

function makeEvent(
  referrer: `0x${string}`,
  timestamp: number,
  incrementalDuration: number,
  opts: Partial<Pick<ReferralEvent, "blockNumber" | "transactionHash" | "id">> = {},
): ReferralEvent {
  return {
    id: opts.id ?? `event-${++eventIdCounter}`,
    referrer,
    timestamp,
    blockNumber: opts.blockNumber ?? 1n,
    transactionHash: opts.transactionHash ?? TX_1,
    incrementalDuration,
    incrementalRevenueContribution: ZERO_ETH,
  };
}

const accurateAsOf = parseTimestamp("2026-06-01T00:00:00Z");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** $2.50 USDC in raw amount (standard award for 1 year of duration at 50% share) */
const STANDARD_AWARD_1Y = parseUsdc("2.5");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("buildReferrerLeaderboardRevShareLimit", () => {
  it("returns empty leaderboard when events list is empty", () => {
    const rules = buildTestRules();
    const result = buildReferrerLeaderboardRevShareLimit([], rules, accurateAsOf);

    expect(result.awardModel).toBe(rules.awardModel);
    expect(result.rules).toBe(rules);
    expect(result.accurateAsOf).toBe(accurateAsOf);
    expect(result.referrers.size).toBe(0);
    expect(result.aggregatedMetrics).toMatchObject({
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: ZERO_ETH,
      awardPoolRemaining: rules.totalAwardPoolValue,
    });
  });

  describe("Scenario A — unqualified referrer: no award claimed", () => {
    it("accumulates standard award but awardPoolApproxValue is $0 when not qualified", () => {
      // Half a year of duration → base revenue = $2.50 (< $5 threshold)
      const events = [
        makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_1 }),
      ];
      const rules = buildTestRules();

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer).toBeDefined();
      expect(referrer.isQualified).toBe(false);
      // standardAwardValue = 0.5 × ($5 × 0.5 years) = 0.5 × $2.50 = $1.25
      expect(referrer.standardAwardValue.amount).toBe(parseUsdc("1.25").amount);
      expect(referrer.awardPoolApproxValue.amount).toBe(0n);

      // Pool should be fully intact
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(
        rules.totalAwardPoolValue.amount,
      );
    });
  });

  describe("Scenario B — referrer just qualifies, claims all accumulated standard award", () => {
    it("claims all accumulated standard award when qualifying (unlimited pool)", () => {
      // Event 1: half year → base revenue = $2.50 (not qualified)
      // Event 2: half year → base revenue = $5.00 (just qualified!)
      // Accumulated standard award = 2 × $1.25 = $2.50
      const rules = buildTestRules(parseUsdc("10000")); // large pool
      const events = [
        makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_1 }),
        makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      expect(referrer.standardAwardValue.amount).toBe(STANDARD_AWARD_1Y.amount);
      // Claims all accumulated: 2 × $1.25 = $2.50
      expect(referrer.awardPoolApproxValue.amount).toBe(STANDARD_AWARD_1Y.amount);
    });
  });

  describe("Scenario B-2 — just qualifies, but pool is too small to cover full accumulated award", () => {
    it("awardPoolApproxValue is capped by remaining pool when qualifying", () => {
      // Same as Scenario B but pool only has $1.50
      const poolAmount = parseUsdc("1.5");
      const rules = buildTestRules(poolAmount);
      const events = [
        makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_1 }),
        makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // standardAwardValue = $2.50 (uncapped)
      expect(referrer.standardAwardValue.amount).toBe(STANDARD_AWARD_1Y.amount);
      // awardPoolApproxValue capped at $1.50 (pool limit)
      expect(referrer.awardPoolApproxValue.amount).toBe(poolAmount.amount);
      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Scenario C — already qualified, claims incremental standard award per event", () => {
    it("qualified referrer claims incremental award on subsequent events (unlimited pool)", () => {
      // Event 1: 1 year → base revenue = $5 (just qualifies), accumulated standard = $2.50, claim $2.50
      // Event 2: 1 year → already qualified, incremental standard = $2.50, claim $2.50
      // Total: $5.00
      const rules = buildTestRules(parseUsdc("10000"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // standardAwardValue = 0.5 × (2 × $5) = $5.00
      expect(referrer.standardAwardValue.amount).toBe(parseUsdc("5").amount);
      // awardPoolApproxValue = $2.50 (qualifying) + $2.50 (incremental) = $5.00
      expect(referrer.awardPoolApproxValue.amount).toBe(parseUsdc("5").amount);
    });
  });

  describe("Scenario C-2 — already qualified, pool only partially covers incremental award", () => {
    it("awardPoolApproxValue is partially truncated on subsequent event when pool is nearly empty", () => {
      // Pool = $3.00
      // Event 1 at t=1000: 1 year → qualifies, claim min($2.50, $3.00) = $2.50, pool = $0.50
      // Event 2 at t=2000: 1 year → already qualified, incremental $2.50, claim min($2.50, $0.50) = $0.50, pool = $0
      const rules = buildTestRules(parseUsdc("3"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // standardAwardValue = 0.5 × $10 = $5.00 (uncapped)
      expect(referrer.standardAwardValue.amount).toBe(parseUsdc("5").amount);
      // awardPoolApproxValue = $2.50 + $0.50 = $3.00 (capped at pool)
      expect(referrer.awardPoolApproxValue.amount).toBe(parseUsdc("3").amount);
      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Scenario D — pool is empty, no award for qualified referrer", () => {
    it("qualified referrer gets $0 when pool is already depleted", () => {
      // Pool = $0
      const rules = buildTestRules(priceUsdc(0n));
      const events = [makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 })];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      expect(referrer.standardAwardValue.amount).toBe(STANDARD_AWARD_1Y.amount);
      expect(referrer.awardPoolApproxValue.amount).toBe(0n);
    });
  });

  describe("Multiple referrers racing — first-come, first-served", () => {
    it("earlier referrer gets more of the pool than a later referrer", () => {
      // Pool = $4
      // ReferrerA qualifies at t=1000 (1 year), claims min($2.50, $4) = $2.50, pool = $1.50
      // ReferrerB qualifies at t=2000 (1 year), claims min($2.50, $1.50) = $1.50, pool = $0
      const rules = buildTestRules(parseUsdc("4"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.isQualified).toBe(true);
      expect(referrerA.awardPoolApproxValue.amount).toBe(STANDARD_AWARD_1Y.amount); // $2.50

      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.awardPoolApproxValue.amount).toBe(parseUsdc("1.5").amount); // $1.50 (only remaining)

      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });

    it("referrer who qualifies after pool is empty gets $0 awardPoolApproxValue", () => {
      // Pool = $2.50 (only enough for 1 qualifying referrer)
      // ReferrerA qualifies at t=1000, claims $2.50, pool = $0
      // ReferrerB qualifies at t=2000, claims min($2.50, $0) = $0
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.awardPoolApproxValue.amount).toBe(STANDARD_AWARD_1Y.amount); // $2.50
      expect(referrerB.awardPoolApproxValue.amount).toBe(0n); // $0 — pool empty
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });

    it("exactly one referrer can be partially truncated (at most)", () => {
      // Pool = $3.75 — enough for ReferrerA ($2.50) + $1.25 for ReferrerB (partial)
      // ReferrerA qualifies at t=1000, claims $2.50, pool = $1.25
      // ReferrerB qualifies at t=2000, claims $1.25 (partial — truncated), pool = $0
      // ReferrerC qualifies at t=3000, claims $0 (pool empty — fully truncated)
      const rules = buildTestRules(parseUsdc("3.75"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
        makeEvent(ADDR_C, 3000, SECONDS_PER_YEAR, { transactionHash: TX_3 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;
      const referrerC = result.referrers.get(ADDR_C)!;

      // Non-truncated: full standard award
      expect(referrerA.awardPoolApproxValue.amount).toBe(STANDARD_AWARD_1Y.amount);
      // Partially truncated: less than standard but > 0
      expect(referrerB.awardPoolApproxValue.amount).toBeGreaterThan(0n);
      expect(referrerB.awardPoolApproxValue.amount).toBeLessThan(STANDARD_AWARD_1Y.amount);
      // Fully truncated: pool empty
      expect(referrerC.awardPoolApproxValue.amount).toBe(0n);
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Deterministic ordering within same timestamp", () => {
    it("breaks ties by blockNumber (lower block wins)", () => {
      // Both referrers have the same timestamp but different block numbers
      // Pool = $2.50 — only enough for one
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [
        {
          ...makeEvent(ADDR_B, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
          blockNumber: 200n,
        },
        {
          ...makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
          blockNumber: 100n,
        },
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);

      // ADDR_A is in block 100 (earlier), should get the award
      expect(result.referrers.get(ADDR_A)!.awardPoolApproxValue.amount).toBe(
        STANDARD_AWARD_1Y.amount,
      );
      expect(result.referrers.get(ADDR_B)!.awardPoolApproxValue.amount).toBe(0n);
    });

    it("breaks ties by transactionHash (lexicographic) when block is the same", () => {
      // Both in same block — TX_1 < TX_2 lexicographically
      // Pool = $2.50 — only enough for one
      const TX_EARLY =
        "0x0000000000000000000000000000000000000000000000000000000000000001" as const;
      const TX_LATE = "0x0000000000000000000000000000000000000000000000000000000000000002" as const;
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [
        {
          ...makeEvent(ADDR_B, 1000, SECONDS_PER_YEAR),
          blockNumber: 100n,
          transactionHash: TX_LATE,
        },
        {
          ...makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
          blockNumber: 100n,
          transactionHash: TX_EARLY,
        },
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);

      // ADDR_A has earlier tx hash (TX_EARLY), should claim the pool first
      expect(result.referrers.get(ADDR_A)!.awardPoolApproxValue.amount).toBe(
        STANDARD_AWARD_1Y.amount,
      );
      expect(result.referrers.get(ADDR_B)!.awardPoolApproxValue.amount).toBe(0n);
    });
  });

  describe("Ranking", () => {
    it("ranks referrers by qualifiedAwardValue desc, then standardAwardValue desc", () => {
      // Pool = $1000 (unlimited for this test)
      // ADDR_A: 1 year → qualifies at t=1000, qualifiedAward = $2.50, standardAward = $2.50
      // ADDR_B: 2 years → qualifies at t=2000, qualifiedAward = $5.00, standardAward = $5.00
      // ADDR_C: 0.5 years → never qualifies, qualifiedAward = $0, standardAward = $1.25
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR * 2, { transactionHash: TX_2 }),
        makeEvent(ADDR_C, 3000, Math.floor(SECONDS_PER_YEAR / 2), { transactionHash: TX_3 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);

      // ADDR_B: qualifiedAward $5.00 → rank 1 (highest pool claim)
      // ADDR_A: qualifiedAward $2.50 → rank 2
      // ADDR_C: qualifiedAward $0, standardAward $1.25 → rank 3 (unqualified)
      expect(result.referrers.get(ADDR_B)!.rank).toBe(1);
      expect(result.referrers.get(ADDR_A)!.rank).toBe(2);
      expect(result.referrers.get(ADDR_C)!.rank).toBe(3);
    });

    it("two fully-truncated referrers are ranked by standardAwardValue desc", () => {
      // Pool = $0 — nobody gets pool money
      // ADDR_A: 2 years → qualifies, standardAward = $5.00, qualifiedAward = $0
      // ADDR_B: 1 year → qualifies, standardAward = $2.50, qualifiedAward = $0
      const rules = buildTestRules(priceUsdc(0n));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR * 2, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);

      // Both have $0 qualifiedAward; ADDR_A has higher standardAward → rank 1
      expect(result.referrers.get(ADDR_A)!.rank).toBe(1);
      expect(result.referrers.get(ADDR_B)!.rank).toBe(2);
    });

    it("referrers map is ordered by rank ascending", () => {
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR * 2, { transactionHash: TX_2 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
      const ranks = [...result.referrers.values()].map((r) => r.rank);
      expect(ranks).toEqual([1, 2]);
    });
  });

  describe("Aggregated metrics", () => {
    it("correctly sums grandTotalReferrals and grandTotalIncrementalDuration", () => {
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, { transactionHash: TX_1 }),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR, { transactionHash: TX_2 }),
        makeEvent(ADDR_B, 3000, SECONDS_PER_YEAR, { transactionHash: TX_3 }),
      ];

      const result = buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);

      expect(result.aggregatedMetrics.grandTotalReferrals).toBe(3);
      expect(result.aggregatedMetrics.grandTotalIncrementalDuration).toBe(3 * SECONDS_PER_YEAR);
    });
  });
});
