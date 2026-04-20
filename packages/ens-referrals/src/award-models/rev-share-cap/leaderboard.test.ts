import type { NormalizedAddress } from "enssdk";
import { beforeEach, describe, expect, it } from "vitest";

import { parseTimestamp, parseUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";

import { SECONDS_PER_YEAR } from "../../time";
import { buildReferrerLeaderboardPageContext } from "../shared/leaderboard-page";
import { ReferralProgramEditionStatuses } from "../shared/status";
import { buildReferrerLeaderboardRevShareCap } from "./leaderboard";
import { buildLeaderboardPageRevShareCap } from "./leaderboard-page";
import type { ReferralEvent } from "./referral-event";
import { type AdminAction, AdminActionTypes, buildReferralProgramRulesRevShareCap } from "./rules";

// ─── Test fixtures ───────────────────────────────────────────────────────────

const ADDR_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const ADDR_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
const ADDR_C = "0xcccccccccccccccccccccccccccccccccccccccc" as const;

const ZERO_ETH = priceEth(0n);

/**
 * A shared prefix for test checkpoint IDs representing a realistic (but fixed)
 * blockTimestamp + chainId + blockNumber + transactionIndex segment.
 *
 * Ponder checkpoint IDs are 75 characters long:
 *   [blockTimestamp: 10][chainId: 16][blockNumber: 16][transactionIndex: 16][eventType: 1][eventIndex: 16]
 */
const CHECKPOINT_PREFIX =
  "0000000000" + // blockTimestamp (10 chars)
  "0000000000000001" + // chainId (16 chars, mainnet = 1)
  "0000000000000001" + // blockNumber (16 chars)
  "0000000000000000" + // transactionIndex (16 chars)
  "0"; // eventType (1 char)

/**
 * Build test rules.
 *
 * - baseAnnualRevenueContribution = $5 USDC (default)
 * - maxBaseRevenueShare = 0.5
 * - 1 year of duration → $5 base revenue → $2.50 uncapped award
 * - minBaseRevenueContribution = $5 → need exactly 1 year to qualify
 *
 * @param awardPool - USDC amount for the pool (default: $1000)
 * @param minBaseRevenueContribution - USDC threshold (default: $5 = 1 year)
 * @param adminActions - Admin actions list (default: none)
 * @param baseAnnualRevenueContribution - Base revenue per year (default: $5)
 */
function buildTestRules(
  awardPool = parseUsdc("1000"),
  minBaseRevenueContribution = parseUsdc("5"),
  adminActions: AdminAction[] = [],
  baseAnnualRevenueContribution = parseUsdc("5"),
) {
  return buildReferralProgramRulesRevShareCap(
    awardPool,
    minBaseRevenueContribution,
    baseAnnualRevenueContribution,
    0.5, // maxBaseRevenueShare
    parseTimestamp("2026-01-01T00:00:00Z"),
    parseTimestamp("2026-12-31T23:59:59Z"),
    { chainId: 1, address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" },
    new URL("https://example.com/rules"),
    false,
    adminActions,
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
  opts: Partial<Pick<ReferralEvent, "id">> = {},
): ReferralEvent {
  const counter = ++eventIdCounter;
  return {
    id: opts.id ?? `${CHECKPOINT_PREFIX}${String(counter).padStart(16, "0")}`,
    referrer,
    timestamp,
    incrementalDuration,
    incrementalRevenueContribution: ZERO_ETH,
  };
}

const accurateAsOf = parseTimestamp("2026-06-01T00:00:00Z");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** $2.50 USDC in raw amount (uncapped award for 1 year of duration at 50% share) */
const UNCAPPED_AWARD_1Y = parseUsdc("2.5");

function disqualification(referrer: NormalizedAddress, reason: string): AdminAction {
  return { actionType: AdminActionTypes.Disqualification, referrer, reason };
}

function warning(referrer: NormalizedAddress, reason: string): AdminAction {
  return { actionType: AdminActionTypes.Warning, referrer, reason };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("buildReferrerLeaderboardRevShareCap", () => {
  beforeEach(() => {
    eventIdCounter = 0;
  });

  it("returns empty leaderboard when events list is empty", () => {
    const rules = buildTestRules();
    const result = buildReferrerLeaderboardRevShareCap([], rules, accurateAsOf);

    expect(result.awardModel).toBe(rules.awardModel);
    expect(result.rules).toBe(rules);
    expect(result.accurateAsOf).toBe(accurateAsOf);
    expect(result.referrers.size).toBe(0);
    expect(result.aggregatedMetrics).toMatchObject({
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: ZERO_ETH,
      awardPoolRemaining: rules.awardPool,
    });
  });

  describe("Scenario A — unqualified referrer: no award claimed", () => {
    it("accumulates uncapped award but cappedAward is $0 when not qualified", () => {
      // Half a year of duration → base revenue = $2.50 (< $5 threshold)
      const events = [makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2))];
      const rules = buildTestRules();

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer).toBeDefined();
      expect(referrer.isQualified).toBe(false);
      // uncappedAward = 0.5 × ($5 × 0.5 years) = 0.5 × $2.50 = $1.25
      expect(referrer.uncappedAward.amount).toBe(parseUsdc("1.25").amount);
      expect(referrer.cappedAward.amount).toBe(0n);

      // Pool should be fully intact
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(rules.awardPool.amount);
    });
  });

  describe("Scenario B — referrer just qualifies, claims all accumulated uncapped award", () => {
    it("claims all accumulated uncapped award when qualifying (uncapped)", () => {
      // Event 1: half year → base revenue = $2.50 (not qualified)
      // Event 2: half year → base revenue = $5.00 (just qualified!)
      // Accumulated uncapped award = 2 × $1.25 = $2.50
      const rules = buildTestRules(parseUsdc("10000")); // large pool
      const events = [
        makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2)),
        makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2)),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      expect(referrer.uncappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
      // Claims all accumulated: 2 × $1.25 = $2.50
      expect(referrer.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
    });
  });

  describe("Scenario B-2 — just qualifies, but pool is too small to cover full accumulated award", () => {
    it("cappedAward is capped by remaining pool when qualifying", () => {
      // Same as Scenario B but pool only has $1.50
      const poolAmount = parseUsdc("1.5");
      const rules = buildTestRules(poolAmount);
      const events = [
        makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2)),
        makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2)),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // uncappedAward = $2.50 (uncapped)
      expect(referrer.uncappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
      // cappedAward capped at $1.50 (pool cap)
      expect(referrer.cappedAward.amount).toBe(poolAmount.amount);
      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Scenario C — already qualified, claims incremental uncapped award per event", () => {
    it("qualified referrer claims incremental award on subsequent events (uncapped)", () => {
      // Event 1: 1 year → base revenue = $5 (just qualifies), accumulated uncapped = $2.50, claim $2.50
      // Event 2: 1 year → already qualified, incremental uncapped = $2.50, claim $2.50
      // Total: $5.00
      const rules = buildTestRules(parseUsdc("10000"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // uncappedAward = 0.5 × (2 × $5) = $5.00
      expect(referrer.uncappedAward.amount).toBe(parseUsdc("5").amount);
      // cappedAward = $2.50 (qualifying) + $2.50 (incremental) = $5.00
      expect(referrer.cappedAward.amount).toBe(parseUsdc("5").amount);
    });
  });

  describe("Scenario C-2 — already qualified, pool only partially covers incremental award", () => {
    it("cappedAward is partially truncated on subsequent event when pool is nearly empty", () => {
      // Pool = $3.00
      // Event 1 at t=1000: 1 year → qualifies, claim min($2.50, $3.00) = $2.50, pool = $0.50
      // Event 2 at t=2000: 1 year → already qualified, incremental $2.50, claim min($2.50, $0.50) = $0.50, pool = $0
      const rules = buildTestRules(parseUsdc("3"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      // uncappedAward = 0.5 × $10 = $5.00 (uncapped)
      expect(referrer.uncappedAward.amount).toBe(parseUsdc("5").amount);
      // cappedAward = $2.50 + $0.50 = $3.00 (capped at pool)
      expect(referrer.cappedAward.amount).toBe(parseUsdc("3").amount);
      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Scenario D — pool is empty, no award for qualified referrer", () => {
    it("qualified referrer gets $0 when pool is already depleted", () => {
      // Pool = $0
      const rules = buildTestRules(priceUsdc(0n));
      const events = [makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR)];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrer = result.referrers.get(ADDR_A)!;

      expect(referrer.isQualified).toBe(true);
      expect(referrer.uncappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
      expect(referrer.cappedAward.amount).toBe(0n);
    });
  });

  describe("Multiple referrers racing — first-come, first-served", () => {
    it("earlier referrer gets more of the pool than a later referrer", () => {
      // Pool = $4
      // ReferrerA qualifies at t=1000 (1 year), claims min($2.50, $4) = $2.50, pool = $1.50
      // ReferrerB qualifies at t=2000 (1 year), claims min($2.50, $1.50) = $1.50, pool = $0
      const rules = buildTestRules(parseUsdc("4"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.isQualified).toBe(true);
      expect(referrerA.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount); // $2.50

      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.cappedAward.amount).toBe(parseUsdc("1.5").amount); // $1.50 (only remaining)

      // Pool fully depleted
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });

    it("referrer who qualifies after pool is empty gets $0 cappedAward", () => {
      // Pool = $2.50 (only enough for 1 qualifying referrer)
      // ReferrerA qualifies at t=1000, claims $2.50, pool = $0
      // ReferrerB qualifies at t=2000, claims min($2.50, $0) = $0
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount); // $2.50
      expect(referrerB.cappedAward.amount).toBe(0n); // $0 — pool empty
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });

    it("exactly one referrer can be partially truncated (at most)", () => {
      // Pool = $3.75 — enough for ReferrerA ($2.50) + $1.25 for ReferrerB (partial)
      // ReferrerA qualifies at t=1000, claims $2.50, pool = $1.25
      // ReferrerB qualifies at t=2000, claims $1.25 (partial — truncated), pool = $0
      // ReferrerC qualifies at t=3000, claims $0 (pool empty — fully truncated)
      const rules = buildTestRules(parseUsdc("3.75"));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
        makeEvent(ADDR_C, 3000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;
      const referrerC = result.referrers.get(ADDR_C)!;

      // Non-truncated: full uncapped award
      expect(referrerA.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
      // Partially truncated: less than uncapped but > 0
      expect(referrerB.cappedAward.amount).toBeGreaterThan(0n);
      expect(referrerB.cappedAward.amount).toBeLessThan(UNCAPPED_AWARD_1Y.amount);
      // Fully truncated: pool empty
      expect(referrerC.cappedAward.amount).toBe(0n);
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);
    });
  });

  describe("Deterministic ordering within same timestamp", () => {
    it("sorts by id — event with lexicographically smaller id wins when timestamps are equal", () => {
      // Both referrers have the same timestamp; ADDR_A has the smaller id and wins the race.
      // Pool = $2.50 — only enough for one.
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [
        makeEvent(ADDR_B, 1000, SECONDS_PER_YEAR, {
          id: `${CHECKPOINT_PREFIX}${"1".padStart(16, "0")}`,
        }),
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR, {
          id: `${CHECKPOINT_PREFIX}${"0".padStart(16, "0")}`,
        }),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);

      // ADDR_A has the lower (earlier) id, should claim the pool first
      expect(result.referrers.get(ADDR_A)!.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
      expect(result.referrers.get(ADDR_B)!.cappedAward.amount).toBe(0n);
    });
  });

  describe("Ranking", () => {
    it("ranks referrers by cappedAward desc, then uncappedAward desc", () => {
      // Pool = $1000 (uncapped for this test)
      // ADDR_A: 1 year → qualifies at t=1000, cappedAward = $2.50, uncappedAward = $2.50
      // ADDR_B: 2 years → qualifies at t=2000, cappedAward = $5.00, uncappedAward = $5.00
      // ADDR_C: 0.5 years → never qualifies, cappedAward = $0, uncappedAward = $1.25
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR * 2),
        makeEvent(ADDR_C, 3000, Math.floor(SECONDS_PER_YEAR / 2)),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);

      // ADDR_B: cappedAward $5.00 → rank 1 (highest pool claim)
      // ADDR_A: cappedAward $2.50 → rank 2
      // ADDR_C: cappedAward $0, uncappedAward $1.25 → rank 3 (unqualified)
      expect(result.referrers.get(ADDR_B)!.rank).toBe(1);
      expect(result.referrers.get(ADDR_A)!.rank).toBe(2);
      expect(result.referrers.get(ADDR_C)!.rank).toBe(3);
    });

    it("two fully-truncated referrers are ranked by uncappedAward desc", () => {
      // Pool = $0 — implementation sorts by totalIncrementalDuration desc, equivalent to uncappedAward desc here.
      // ADDR_A: 2 years → qualifies, uncappedAward = $5.00, cappedAward = $0
      // ADDR_B: 1 year → qualifies, uncappedAward = $2.50, cappedAward = $0
      const rules = buildTestRules(priceUsdc(0n));
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR * 2),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);

      // Both have $0 cappedAward; ADDR_A has higher uncappedAward (longer duration) → rank 1
      expect(result.referrers.get(ADDR_A)!.rank).toBe(1);
      expect(result.referrers.get(ADDR_B)!.rank).toBe(2);
    });

    it("referrers map is ordered by rank ascending", () => {
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR * 2),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const ranks = [...result.referrers.values()].map((r) => r.rank);
      expect(ranks).toEqual([1, 2]);
    });
  });

  describe("Edition status via leaderboard page", () => {
    it("page status is Exhausted when pool is fully consumed within the active window", () => {
      // Pool = $2.50 — just enough for one qualifying referrer
      // ADDR_A qualifies at t=1000 (1 year), claims the full pool → awardPoolRemaining = $0
      // accurateAsOf is within the active window (2026-06-01), so status must be Exhausted
      const rules = buildTestRules(parseUsdc("2.5"));
      const events = [makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR)];

      const leaderboard = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      expect(leaderboard.aggregatedMetrics.awardPoolRemaining.amount).toBe(0n);

      const pageContext = buildReferrerLeaderboardPageContext({ page: 1 }, leaderboard);
      const page = buildLeaderboardPageRevShareCap(pageContext, leaderboard);

      expect(page.status).toBe(ReferralProgramEditionStatuses.Exhausted);
    });
  });

  describe("Configurable baseAnnualRevenueContribution", () => {
    it("calculations scale with the configured baseAnnualRevenueContribution", () => {
      // baseAnnualRevenueContribution = $10/yr (double the default $5/yr)
      // maxBaseRevenueShare = 0.5
      // minBaseRevenueContribution = $10 → need exactly 1 year to qualify
      // 1 year of duration → $10 base revenue → $5.00 uncapped award
      // 0.5 years of duration → $5 base revenue (below $10 threshold) → not qualified
      const rules = buildTestRules(
        parseUsdc("1000"), // awardPool
        parseUsdc("10"), // minBaseRevenueContribution
        [], // adminActions
        parseUsdc("10"), // baseAnnualRevenueContribution
      );
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR), // qualifies: $10 base → $5 uncapped
        makeEvent(ADDR_B, 2000, Math.floor(SECONDS_PER_YEAR / 2)), // below threshold: $5 base
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      // ADDR_A: 1 year at $10/yr → $10 base → uncapped = 0.5 × $10 = $5.00
      expect(referrerA.isQualified).toBe(true);
      expect(referrerA.uncappedAward.amount).toBe(parseUsdc("5").amount);
      expect(referrerA.cappedAward.amount).toBe(parseUsdc("5").amount);

      // ADDR_B: 0.5 years at $10/yr → $5 base → below $10 threshold → not qualified
      // uncapped = 0.5 × $5 = $2.50, but capped = $0
      expect(referrerB.isQualified).toBe(false);
      expect(referrerB.uncappedAward.amount).toBe(parseUsdc("2.5").amount);
      expect(referrerB.cappedAward.amount).toBe(0n);

      // Pool consumed only by ADDR_A's $5 claim
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(parseUsdc("995").amount);
    });
  });

  describe("Aggregated metrics", () => {
    it("correctly sums grandTotalReferrals and grandTotalIncrementalDuration", () => {
      const rules = buildTestRules();
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 3000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);

      expect(result.aggregatedMetrics.grandTotalReferrals).toBe(3);
      expect(result.aggregatedMetrics.grandTotalIncrementalDuration).toBe(3 * SECONDS_PER_YEAR);
    });
  });

  describe("Admin actions", () => {
    it("no admin actions — qualified referrers receive awards normally", () => {
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), []);
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.isQualified).toBe(true);
      expect(referrerA.adminAction).toBe(null);
      expect(referrerA.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);

      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.adminAction).toBe(null);
    });

    it("disqualified referrer who met threshold: cappedAward = 0, pool preserved for next", () => {
      // ADDR_A qualifies by revenue but is admin-disqualified → pool claim = 0
      // ADDR_B qualifies later → gets the full pool share
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        disqualification(ADDR_A, "self-referral"),
      ]);
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR), // would qualify, but disqualified
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR), // qualifies normally
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      expect(referrerA.adminAction).toEqual(disqualification(ADDR_A, "self-referral"));
      expect(referrerA.isQualified).toBe(false);
      expect(referrerA.cappedAward.amount).toBe(0n);

      // Pool was not consumed by ADDR_A, so ADDR_B gets the full award
      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.adminAction).toBe(null);
      expect(referrerB.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
    });

    it("disqualified referrer who never met the revenue threshold: pool unchanged", () => {
      // ADDR_A has half a year (below threshold) and is disqualified — pool should be fully intact
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        disqualification(ADDR_A, "promoting discounts"),
      ]);
      const events = [makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2))];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;

      expect(referrerA.adminAction?.actionType).toBe(AdminActionTypes.Disqualification);
      expect(referrerA.adminAction?.reason).toBe("promoting discounts");
      expect(referrerA.isQualified).toBe(false);
      expect(referrerA.cappedAward.amount).toBe(0n);
      // Pool fully intact
      expect(result.aggregatedMetrics.awardPoolRemaining.amount).toBe(parseUsdc("1000").amount);
    });

    it("disqualified referrer ranks between qualified (pool claim) and unqualified (below threshold)", () => {
      // ADDR_A: 2 years, disqualified → uncappedAward $5.00, pool claim $0
      // ADDR_B: 1 year, qualified  → uncappedAward $2.50, pool claim $2.50
      // ADDR_C: 0.5 years, below threshold → uncappedAward $1.25, pool claim $0
      //
      // Sort by pool claim desc, then duration desc:
      //   rank 1 → ADDR_B ($2.50 claim)
      //   rank 2 → ADDR_A ($0 claim, 2y duration — beats ADDR_C on duration)
      //   rank 3 → ADDR_C ($0 claim, 0.5y duration)
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        disqualification(ADDR_A, "cheating"),
      ]);
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR * 2),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
        makeEvent(ADDR_C, 3000, Math.floor(SECONDS_PER_YEAR / 2)),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;
      const referrerC = result.referrers.get(ADDR_C)!;

      expect(referrerB.rank).toBe(1);
      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.adminAction).toBe(null);
      expect(referrerB.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);

      expect(referrerA.rank).toBe(2);
      expect(referrerA.adminAction?.actionType).toBe(AdminActionTypes.Disqualification);
      expect(referrerA.adminAction?.reason).toBe("cheating");
      expect(referrerA.isQualified).toBe(false);
      expect(referrerA.cappedAward.amount).toBe(0n);

      expect(referrerC.rank).toBe(3);
      expect(referrerC.isQualified).toBe(false);
      expect(referrerC.adminAction).toBe(null);
      expect(referrerC.cappedAward.amount).toBe(0n);
    });

    it("multiple admin actions: all disqualified referrers have Disqualification adminAction", () => {
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        disqualification(ADDR_A, "reason-a"),
        disqualification(ADDR_B, "reason-b"),
      ]);
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
        makeEvent(ADDR_C, 3000, SECONDS_PER_YEAR), // only C qualifies and claims
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;
      const referrerC = result.referrers.get(ADDR_C)!;

      expect(referrerA.adminAction?.actionType).toBe(AdminActionTypes.Disqualification);
      expect(referrerA.adminAction?.reason).toBe("reason-a");
      expect(referrerA.isQualified).toBe(false);
      expect(referrerA.cappedAward.amount).toBe(0n);

      expect(referrerB.adminAction?.actionType).toBe(AdminActionTypes.Disqualification);
      expect(referrerB.adminAction?.reason).toBe("reason-b");
      expect(referrerB.isQualified).toBe(false);
      expect(referrerB.cappedAward.amount).toBe(0n);

      expect(referrerC.adminAction).toBe(null);
      expect(referrerC.isQualified).toBe(true);
      expect(referrerC.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);
    });

    it("duplicate address in adminActions: buildReferralProgramRulesRevShareCap throws", () => {
      expect(() =>
        buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
          disqualification(ADDR_A, "first"),
          warning(ADDR_A, "duplicate"),
        ]),
      ).toThrow(
        "ReferralProgramRulesRevShareCap: adminActions must not contain duplicate referrer addresses.",
      );
    });

    it("warned referrer still qualifies and receives awards", () => {
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        warning(ADDR_A, "suspicious activity"),
      ]);
      const events = [
        makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
        makeEvent(ADDR_B, 2000, SECONDS_PER_YEAR),
      ];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;
      const referrerB = result.referrers.get(ADDR_B)!;

      // Warned referrer is NOT disqualified — they still qualify and get awards
      expect(referrerA.adminAction).toEqual(warning(ADDR_A, "suspicious activity"));
      expect(referrerA.isQualified).toBe(true);
      expect(referrerA.cappedAward.amount).toBe(UNCAPPED_AWARD_1Y.amount);

      expect(referrerB.isQualified).toBe(true);
      expect(referrerB.adminAction).toBe(null);
    });

    it("warned referrer who is below threshold: warning present but not qualified", () => {
      const rules = buildTestRules(parseUsdc("1000"), parseUsdc("5"), [
        warning(ADDR_A, "under review"),
      ]);
      const events = [makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2))];

      const result = buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
      const referrerA = result.referrers.get(ADDR_A)!;

      expect(referrerA.adminAction?.actionType).toBe(AdminActionTypes.Warning);
      expect(referrerA.isQualified).toBe(false); // below threshold, not because of warning
      expect(referrerA.cappedAward.amount).toBe(0n);
    });
  });
});
