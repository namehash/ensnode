import { beforeAll, describe, expect, it } from "vitest";

import { ENSNamespaceIds, priceUsdc } from "@ensnode/ensnode-sdk";

import { deserializeReferralProgramEditionConfigSetArray } from "./api";
import type { ReferralProgramRulesPieSplit } from "./award-models/pie-split/rules";
import type { ReferralProgramRulesRevShareLimit } from "./award-models/rev-share-limit/rules";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import {
  REFERRAL_PROGRAM_EDITION_SLUG_PATTERN,
  type ReferralProgramEditionConfig,
} from "./edition";
import { getDefaultReferralProgramEditionConfigSet } from "./edition-defaults";

const PRODUCTION_EDITIONS_URL = "https://ensawards.org/production-editions.json";

async function fetchProductionEditions(): Promise<ReferralProgramEditionConfig[] | null> {
  let response: Response;
  try {
    response = await fetch(PRODUCTION_EDITIONS_URL);
  } catch {
    return null;
  }

  if (!response.ok) return null;
  // Intentionally let deserialize errors throw so parity regressions fail the suite.
  return deserializeReferralProgramEditionConfigSetArray(await response.json());
}

describe("getDefaultReferralProgramEditionConfigSet", () => {
  const configSet = getDefaultReferralProgramEditionConfigSet(ENSNamespaceIds.Mainnet);

  describe("Should match production editions", () => {
    let productionEditions: ReferralProgramEditionConfig[] | null = null;

    beforeAll(async () => {
      productionEditions = await fetchProductionEditions();
    });

    it("Returns the expected number of editions", ({ skip }) => {
      if (!productionEditions)
        return skip(`Could not fetch production editions from ${PRODUCTION_EDITIONS_URL}`);
      expect(configSet.size).toBe(productionEditions.length);
    });

    it("Contains all expected edition `slug`s", ({ skip }) => {
      if (!productionEditions)
        return skip(`Could not fetch production editions from ${PRODUCTION_EDITIONS_URL}`);
      expect(new Set(configSet.keys())).toStrictEqual(
        new Set(productionEditions.map((e) => e.slug)),
      );
    });

    it("Each edition matches its production counterpart", ({ skip }) => {
      if (!productionEditions)
        return skip(`Could not fetch production editions from ${PRODUCTION_EDITIONS_URL}`);

      for (const expected of productionEditions) {
        const edition = configSet.get(expected.slug);
        expect(edition, `edition "${expected.slug}" should exist`).toBeDefined();

        if (edition === undefined) continue;

        const rules = edition.rules;

        expect(
          edition.displayName,
          `edition "${expected.slug}" should have the correct <displayName>. Expected "${expected.displayName}", got "${edition.displayName}"`,
        ).toBe(expected.displayName);
        expect(
          rules.awardModel,
          `edition "${expected.slug}" should have the correct <awardModel>. Expected "${expected.rules.awardModel}", got "${rules.awardModel}"`,
        ).toBe(expected.rules.awardModel);
        expect(
          rules.startTime,
          `edition "${expected.slug}" should have the correct <startTime>. Expected "${expected.rules.startTime}", got "${rules.startTime}"`,
        ).toBe(expected.rules.startTime);
        expect(
          rules.endTime,
          `edition "${expected.slug}" should have the correct <endTime>. Expected "${expected.rules.endTime}", got "${rules.endTime}"`,
        ).toBe(expected.rules.endTime);
        expect(
          rules.subregistryId,
          `edition "${expected.slug}" should have the correct <subregistryId>. Expected "${expected.rules.subregistryId}", got "${rules.subregistryId}"`,
        ).toStrictEqual(expected.rules.subregistryId);
        expect(
          rules.rulesUrl,
          `edition "${expected.slug}" should have the correct <rulesUrl>. Expected "${new URL(expected.rules.rulesUrl)}", got "${rules.rulesUrl}"`,
        ).toStrictEqual(new URL(expected.rules.rulesUrl));
        expect(
          rules.areAwardsDistributed,
          `edition "${expected.slug}" should have the correct <areAwardsDistributed>. Expected "${expected.rules.areAwardsDistributed}", got "${rules.areAwardsDistributed}"`,
        ).toBe(expected.rules.areAwardsDistributed);

        if (
          rules.awardModel !== ReferralProgramAwardModels.Unrecognized &&
          expected.rules.awardModel !== ReferralProgramAwardModels.Unrecognized
        ) {
          expect(
            rules.totalAwardPoolValue,
            `edition "${expected.slug}" should have the correct <totalAwardPoolValue>. Expected "${priceUsdc(expected.rules.totalAwardPoolValue.amount)}", got "${rules.totalAwardPoolValue}"`,
          ).toStrictEqual(priceUsdc(expected.rules.totalAwardPoolValue.amount));
        }

        // If statements required for type-safety.
        // The equality of the `awardModel` field is guaranteed by the test above
        if (
          rules.awardModel === ReferralProgramAwardModels.PieSplit &&
          expected.rules.awardModel === ReferralProgramAwardModels.PieSplit
        ) {
          const expectedPieSplitRules = expected.rules as ReferralProgramRulesPieSplit;
          expect(
            rules.maxQualifiedReferrers,
            `edition "${expected.slug}" should have the correct <maxQualifiedReferrers>. Expected "${expectedPieSplitRules.maxQualifiedReferrers}", got "${rules.maxQualifiedReferrers}"`,
          ).toBe(expectedPieSplitRules.maxQualifiedReferrers);
        }

        if (
          rules.awardModel === ReferralProgramAwardModels.RevShareLimit &&
          expected.rules.awardModel === ReferralProgramAwardModels.RevShareLimit
        ) {
          const expectedRevShareLimitRules = expected.rules as ReferralProgramRulesRevShareLimit;
          expect(
            rules.minQualifiedRevenueContribution,
            `edition "${expected.slug}" should have the correct <minQualifiedRevenueContribution>. Expected "${priceUsdc(expectedRevShareLimitRules.minQualifiedRevenueContribution.amount)}", got "${rules.minQualifiedRevenueContribution}"`,
          ).toStrictEqual(
            priceUsdc(expectedRevShareLimitRules.minQualifiedRevenueContribution.amount),
          );
          expect(
            rules.qualifiedRevenueShare,
            `edition "${expected.slug}" should have the correct <qualifiedRevenueShare>. Expected "${expectedRevShareLimitRules.qualifiedRevenueShare}", got "${rules.qualifiedRevenueShare}"`,
          ).toBe(expectedRevShareLimitRules.qualifiedRevenueShare);
        }
      }
    });
  });

  describe("Should have a valid structure", () => {
    it("Maintains the config set invariant (map key === config.slug)", () => {
      for (const [key, config] of configSet) {
        expect(key, `config key "${key}" should match config.slug "${config.slug}"`).toBe(
          config.slug,
        );
      }
    });

    it("All editions have valid `slug` format", () => {
      for (const [slug] of configSet) {
        expect(slug, `edition "${slug}" should match the slug pattern`).toMatch(
          REFERRAL_PROGRAM_EDITION_SLUG_PATTERN,
        );
      }
    });

    it("All editions have non-empty `displayName`s", () => {
      for (const [, config] of configSet) {
        expect(
          config.displayName.length,
          `edition "${config.slug}" should have a non-empty <displayName>`,
        ).toBeGreaterThan(0);
      }
    });

    it("All editions have `endTime` >= `startTime`", () => {
      for (const [, config] of configSet) {
        expect(
          config.rules.endTime,
          `edition "${config.slug}" should have <endTime> >= <startTime>. Got endTime: "${config.rules.endTime}", startTime: "${config.rules.startTime}"`,
        ).toBeGreaterThanOrEqual(config.rules.startTime);
      }
    });

    it("All editions have a recognized `awardModel`", () => {
      const recognizedModels: string[] = [
        ReferralProgramAwardModels.PieSplit,
        ReferralProgramAwardModels.RevShareLimit,
      ];
      for (const [, config] of configSet) {
        expect(
          recognizedModels,
          `edition "${config.slug}" should have a recognized <awardModel>`,
        ).toContain(config.rules.awardModel);
      }
    });

    it("All editions have valid `rulesUrl`s", () => {
      for (const [, config] of configSet) {
        expect(
          config.rules.rulesUrl,
          `edition "${config.slug}" should have a valid <rulesUrl>`,
        ).toBeInstanceOf(URL);
        expect(
          config.rules.rulesUrl.protocol,
          `edition "${config.slug}" should have a valid <rulesUrl> protocol`,
        ).toBe("https:");
      }
    });
  });

  describe("Error handling", () => {
    it("Throws for an unsupported namespace", () => {
      expect(() => getDefaultReferralProgramEditionConfigSet("invalid-namespace" as any)).toThrow();
    });
  });
});
