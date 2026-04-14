import { describe, expect, it } from "vitest";

import { ReferralProgramAwardModels } from "./rules";
import {
  calcBaseReferralProgramEditionStatus,
  ReferralProgramEditionStatuses,
  type ReferralProgramEditionStatusId,
} from "./status";

const baseRules = {
  awardModel: ReferralProgramAwardModels.PieSplit,
  startTime: 1000,
  endTime: 2000,
  subregistryId: { chainId: 1, address: "0x0000000000000000000000000000000000000000" as const },
  rulesUrl: new URL("https://example.com/rules"),
};

describe("calcBaseReferralProgramEditionStatus", () => {
  it("returns Scheduled when now is before startTime", () => {
    const status = calcBaseReferralProgramEditionStatus(
      { ...baseRules, areAwardsDistributed: false },
      999,
    );
    expect(status).toBe<ReferralProgramEditionStatusId>(ReferralProgramEditionStatuses.Scheduled);
  });

  it("returns Active when now is within the active window", () => {
    const status = calcBaseReferralProgramEditionStatus(
      { ...baseRules, areAwardsDistributed: false },
      1500,
    );
    expect(status).toBe<ReferralProgramEditionStatusId>(ReferralProgramEditionStatuses.Active);
  });

  it("returns AwardsReview when now is after endTime and awards are not yet distributed", () => {
    const status = calcBaseReferralProgramEditionStatus(
      { ...baseRules, areAwardsDistributed: false },
      2001,
    );
    expect(status).toBe<ReferralProgramEditionStatusId>(
      ReferralProgramEditionStatuses.AwardsReview,
    );
  });

  it("returns Closed when now is after endTime and awards have been distributed", () => {
    const status = calcBaseReferralProgramEditionStatus(
      { ...baseRules, areAwardsDistributed: true },
      2001,
    );
    expect(status).toBe<ReferralProgramEditionStatusId>(ReferralProgramEditionStatuses.Closed);
  });
});
