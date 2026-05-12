import { type AccountId, type Address, toNormalizedAddress } from "enssdk";
import { describe, expect, it } from "vitest";

import { priceEth } from "@ensnode/ensnode-sdk";

import { buildReferrerMetrics, type ReferrerMetrics } from "../../referrer-metrics";
import { assertLeaderboardInputs } from "./leaderboard-guards";
import { type BaseReferralProgramRules, ReferralProgramAwardModels } from "./rules";

const acct = (address: Address): AccountId => ({
  chainId: 1,
  address: toNormalizedAddress(address),
});

const rules: BaseReferralProgramRules = {
  awardModel: ReferralProgramAwardModels.PieSplit,
  startTime: 1000,
  endTime: 2000,
  subregistryId: acct("0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"),
  rulesUrl: new URL("https://example.com/rules"),
  areAwardsDistributed: false,
};

const accurateAsOf = 1500;

const metrics = (referrer: AccountId): ReferrerMetrics =>
  buildReferrerMetrics(referrer, 1, 60, priceEth(0n));

describe("assertLeaderboardInputs", () => {
  it("accepts distinct referrers", () => {
    const inputs = [
      metrics(acct("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")),
      metrics(acct("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")),
    ];

    expect(() => assertLeaderboardInputs(inputs, rules, accurateAsOf)).not.toThrow();
  });

  it("rejects two distinct AccountId object instances with the same chainId+address (value-equality dedupe)", () => {
    // Two separate object instances representing the same referrer — a Set keyed by object
    // identity would NOT catch this; the guard must compare by stringified CAIP-10.
    const referrerA = acct("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const referrerAClone = acct("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(referrerA).not.toBe(referrerAClone); // sanity: distinct object identities

    const inputs = [metrics(referrerA), metrics(referrerAClone)];

    expect(() => assertLeaderboardInputs(inputs, rules, accurateAsOf)).toThrow(
      /duplicate referrers/i,
    );
  });

  it("accepts the same address on different chainIds (chain-scoped identity)", () => {
    const address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
    const inputs = [
      metrics({ chainId: 1, address: toNormalizedAddress(address) }),
      metrics({ chainId: 8453, address: toNormalizedAddress(address) }),
    ];

    expect(() => assertLeaderboardInputs(inputs, rules, accurateAsOf)).not.toThrow();
  });

  it("accepts an empty referrers array", () => {
    expect(() => assertLeaderboardInputs([], rules, accurateAsOf)).not.toThrow();
  });
});
