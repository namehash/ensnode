import { type Address, asInterpretedName } from "enssdk";
import type { Hash } from "viem";
import { beforeEach, describe, expect, it } from "vitest";

import { parseEth, parseTimestamp, parseUsdc, priceEth } from "@ensnode/ensnode-sdk";

import { SECONDS_PER_YEAR } from "../../time";
import { buildReferralEditionSnapshotRevShareCap } from "./leaderboard";
import type { ReferralEvent } from "./referral-event";
import { type AdminAction, AdminActionTypes, buildReferralProgramRulesRevShareCap } from "./rules";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ADDR_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const ADDR_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;

const CHECKPOINT_PREFIX =
  "0000000000" + "0000000000000001" + "0000000000000001" + "0000000000000000" + "0";

function buildTestRules(
  awardPool = parseUsdc("1000"),
  minBaseRevenueContribution = parseUsdc("5"),
  adminActions: AdminAction[] = [],
) {
  return buildReferralProgramRulesRevShareCap(
    awardPool,
    minBaseRevenueContribution,
    parseUsdc("5"),
    0.5,
    parseTimestamp("2026-01-01T00:00:00Z"),
    parseTimestamp("2026-12-31T23:59:59Z"),
    { chainId: 1, address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" },
    new URL("https://example.com/rules"),
    false,
    adminActions,
  );
}

let eventIdCounter = 0;
function makeEvent(
  referrer: `0x${string}`,
  timestamp: number,
  incrementalDuration: number,
): ReferralEvent {
  const counter = ++eventIdCounter;
  return {
    id: `${CHECKPOINT_PREFIX}${String(counter).padStart(16, "0")}`,
    referrer,
    timestamp,
    incrementalDuration,
    incrementalRevenueContribution: priceEth(0n),
    name: asInterpretedName("test.eth"),
    actionType: "registration",
    transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash,
    registrant: "0xdddddddddddddddddddddddddddddddddddddddd" as Address,
  };
}

const accurateAsOf = parseTimestamp("2026-06-01T00:00:00Z");

beforeEach(() => {
  eventIdCounter = 0;
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildReferralEditionSnapshotRevShareCap — per-event trace", () => {
  it("emits one trace entry per input event in chronological order", () => {
    const rules = buildTestRules();
    const events = [
      makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2)),
      makeEvent(ADDR_B, 1500, SECONDS_PER_YEAR),
      makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2)),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords).toHaveLength(3);
    expect(accountingRecords.map((e) => e.registrarActionId)).toEqual(events.map((e) => e.id));
    expect(accountingRecords.map((e) => e.referrer)).toEqual([ADDR_A, ADDR_B, ADDR_A]);
  });

  it("not-yet-qualified: incrementalTentativeAward = 0, effectiveBaseRevShare = 0", () => {
    // Half a year → base revenue = $2.50 < threshold ($5)
    const rules = buildTestRules();
    const events = [makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2))];
    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords).toHaveLength(1);
    const record = accountingRecords[0];
    expect(record.tentativeAward.incrementalTentativeAward.amount).toBe(0n);
    expect(record.tentativeAward.effectiveBaseRevShare).toBe(0);
    expect(record.tentativeAward.disqualified).toBe(false);
    expect(record.tentativeAward.disqualificationReason).toBeUndefined();
    expect(record.tentativeAward.awardPoolRemaining.amount).toBe(rules.awardPool.amount);
    expect(record.tentativeAward.maxRevShare).toBe(rules.maxBaseRevenueShare);
  });

  it("newly-qualifying with full pool: claims accumulated uncapped award in one lump", () => {
    // Event 1: half year (not qualified) — award = 0, poolBefore = 10000
    // Event 2: half year (crosses threshold) — accumulated uncapped = $2.50, poolBefore = 10000
    const rules = buildTestRules(parseUsdc("10000"));
    const events = [
      makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2)),
      makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2)),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords).toHaveLength(2);

    const first = accountingRecords[0];
    expect(first.tentativeAward.incrementalTentativeAward.amount).toBe(0n);

    const second = accountingRecords[1];
    // Claims the accumulated uncapped award: $2.50 (not just this event's half-year)
    expect(second.tentativeAward.incrementalTentativeAward.amount).toBe(parseUsdc("2.5").amount);
    // awardPoolRemaining is captured BEFORE the event — still the full pool
    expect(second.tentativeAward.awardPoolRemaining.amount).toBe(parseUsdc("10000").amount);
    // On first-time qualification, effectiveBaseRevShare can exceed maxRevShare (claims past events' value).
    expect(second.tentativeAward.effectiveBaseRevShare).toBeGreaterThan(rules.maxBaseRevenueShare);
  });

  it("newly-qualifying with tight pool: tentativeAward truncated to remaining pool", () => {
    // Pool = $1.50, accumulated uncapped = $2.50 → capped at $1.50
    const rules = buildTestRules(parseUsdc("1.5"));
    const events = [
      makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2)),
      makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2)),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    const second = accountingRecords[1];
    expect(second.tentativeAward.incrementalTentativeAward.amount).toBe(parseUsdc("1.5").amount);
    expect(second.tentativeAward.awardPoolRemaining.amount).toBe(parseUsdc("1.5").amount);
  });

  it("already-qualified: claims incremental uncapped award per event, effectiveBaseRevShare ≈ maxRevShare", () => {
    // Event 1: 1 year → qualifies, claims $2.50, pool = 10000 → 9997.5
    // Event 2: 1 year → incremental $2.50, claims $2.50, pool = 9997.5 → 9995
    const rules = buildTestRules(parseUsdc("10000"));
    const events = [
      makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
      makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    // Event 2 is the already-qualified claim.
    const second = accountingRecords[1];
    expect(second.tentativeAward.incrementalTentativeAward.amount).toBe(parseUsdc("2.5").amount);
    // incrementalBase = $5, incrementalTentative = $2.50 → effective = 0.5 = maxRevShare
    expect(second.tentativeAward.effectiveBaseRevShare).toBeCloseTo(rules.maxBaseRevenueShare, 10);
  });

  it("already-qualified with pool-truncation: effectiveBaseRevShare < maxRevShare", () => {
    // Pool = $3.00
    // Event 1: 1 year → qualifies, claims min($2.50, $3) = $2.50, pool = $0.50
    // Event 2: 1 year → incremental $2.50, claims min($2.50, $0.50) = $0.50 (truncated), effective = 0.10
    const rules = buildTestRules(parseUsdc("3"));
    const events = [
      makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
      makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    const second = accountingRecords[1];
    expect(second.tentativeAward.incrementalTentativeAward.amount).toBe(parseUsdc("0.5").amount);
    // awardPoolRemaining captured BEFORE this event = $0.50
    expect(second.tentativeAward.awardPoolRemaining.amount).toBe(parseUsdc("0.5").amount);
    expect(second.tentativeAward.effectiveBaseRevShare).toBeLessThan(rules.maxBaseRevenueShare);
  });

  it("pool-exhausted: subsequent events claim 0 and awardPoolRemaining is 0", () => {
    // Pool exactly $2.50 → A qualifies with $2.50 on event 1, then pool is empty
    const rules = buildTestRules(parseUsdc("2.5"));
    const events = [
      makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
      makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords[0].tentativeAward.incrementalTentativeAward.amount).toBe(
      parseUsdc("2.5").amount,
    );
    expect(accountingRecords[1].tentativeAward.incrementalTentativeAward.amount).toBe(0n);
    expect(accountingRecords[1].tentativeAward.awardPoolRemaining.amount).toBe(0n);
    expect(accountingRecords[1].tentativeAward.effectiveBaseRevShare).toBe(0);
  });

  it("admin-disqualified: every trace entry flags disqualified and tentativeAward is 0", () => {
    const rules = buildTestRules(parseUsdc("10000"), parseUsdc("5"), [
      { actionType: AdminActionTypes.Disqualification, referrer: ADDR_A, reason: "sybil ring" },
    ]);
    const events = [
      makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
      makeEvent(ADDR_A, 2000, SECONDS_PER_YEAR),
    ];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    for (const record of accountingRecords) {
      expect(record.tentativeAward.disqualified).toBe(true);
      expect(record.tentativeAward.disqualificationReason).toBe("sybil ring");
      expect(record.tentativeAward.incrementalTentativeAward.amount).toBe(0n);
      expect(record.tentativeAward.effectiveBaseRevShare).toBe(0);
    }
  });

  it("warning (non-disqualifying admin action) still allows awards, disqualified = false", () => {
    const rules = buildTestRules(parseUsdc("10000"), parseUsdc("5"), [
      { actionType: AdminActionTypes.Warning, referrer: ADDR_A, reason: "be careful" },
    ]);
    const events = [makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR)];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords[0].tentativeAward.disqualified).toBe(false);
    expect(accountingRecords[0].tentativeAward.disqualificationReason).toBeUndefined();
    expect(accountingRecords[0].tentativeAward.incrementalTentativeAward.amount).toBe(
      parseUsdc("2.5").amount,
    );
  });

  it("returns a leaderboard alongside the accounting records that reflects the rules and per-referrer awards", () => {
    const rules = buildTestRules(parseUsdc("10000"));
    const events = [
      makeEvent(ADDR_A, 1000, SECONDS_PER_YEAR),
      makeEvent(ADDR_B, 1500, Math.floor(SECONDS_PER_YEAR / 2)),
      makeEvent(ADDR_A, 2500, Math.floor(SECONDS_PER_YEAR / 2)),
    ];

    const leaderboard = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).leaderboard;

    // Deep spot-checks
    expect(leaderboard.awardModel).toBe(rules.awardModel);
    expect(leaderboard.rules).toBe(rules);
    expect(leaderboard.accurateAsOf).toBe(accurateAsOf);
    const a = leaderboard.referrers.get(ADDR_A)!;
    expect(a.isQualified).toBe(true);
    // A: 1.5 years → base $7.50 → uncapped $3.75
    expect(a.uncappedAward.amount).toBe(parseUsdc("3.75").amount);
  });

  it("totalRevenueContribution accumulates across events in the trace entries", () => {
    const rules = buildTestRules(parseUsdc("10000"));
    const e1 = makeEvent(ADDR_A, 1000, Math.floor(SECONDS_PER_YEAR / 2));
    e1.incrementalRevenueContribution = parseEth("1");
    const e2 = makeEvent(ADDR_A, 2000, Math.floor(SECONDS_PER_YEAR / 2));
    e2.incrementalRevenueContribution = parseEth("0.5");
    const events = [e1, e2];

    const accountingRecords = buildReferralEditionSnapshotRevShareCap(
      events,
      rules,
      accurateAsOf,
    ).accountingRecords;

    expect(accountingRecords[0].tentativeAward.accumulatedRevenueContribution.amount).toBe(
      parseEth("1").amount,
    );
    expect(accountingRecords[1].tentativeAward.accumulatedRevenueContribution.amount).toBe(
      parseEth("1.5").amount,
    );
    expect(accountingRecords[0].tentativeAward.incrementalRevenueContribution.amount).toBe(
      parseEth("1").amount,
    );
    expect(accountingRecords[1].tentativeAward.incrementalRevenueContribution.amount).toBe(
      parseEth("0.5").amount,
    );
  });
});
