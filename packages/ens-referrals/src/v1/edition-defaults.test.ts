import { describe, expect, it } from "vitest";

import { priceUsdc } from "@ensnode/ensnode-sdk";

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
  try {
    const response = await fetch(PRODUCTION_EDITIONS_URL);
    if (!response.ok) return null;
    return (await response.json()) as ReferralProgramEditionConfig[];
  } catch {
    return null;
  }
}

describe("getDefaultReferralProgramEditionConfigSet", () => {
  const configSet = getDefaultReferralProgramEditionConfigSet("mainnet");

  describe("Should match production editions", async () => {
    const productionEditions = await fetchProductionEditions();

    if (!productionEditions) {
      throw new Error(`Could not fetch production editions from ${PRODUCTION_EDITIONS_URL}`);
    }

    it("Returns the expected number of editions", () => {
      expect(configSet.size).toBe(productionEditions.length);
    });

    it("Contains all expected edition `slug`s", () => {
      expect(new Set(configSet.keys())).toStrictEqual(
        new Set(productionEditions.map((e) => e.slug)),
      );
    });

    for (const expected of productionEditions) {
      describe(`${expected.slug} edition (${expected.rules.awardModel})`, () => {
        const edition = configSet.get(expected.slug);

        it("Should exist in the config set", () => {
          expect(edition).toBeDefined();
        });

        if (edition !== undefined) {
          const rules = edition.rules;

          it("Should have the correct `displayName`", () => {
            expect(edition.displayName).toBe(expected.displayName);
          });

          it("Should have the correct `awardModel`", () => {
            expect(rules.awardModel).toBe(expected.rules.awardModel);
          });

          it("Should have the correct start and end times", () => {
            expect(rules.startTime).toBe(expected.rules.startTime);
            expect(rules.endTime).toBe(expected.rules.endTime);
          });

          it("Should have the correct `subregistryId`", () => {
            expect(rules.subregistryId).toStrictEqual(expected.rules.subregistryId);
          });

          it("Should have the correct `rulesUrl`", () => {
            expect(rules.rulesUrl).toStrictEqual(new URL(expected.rules.rulesUrl));
          });

          it("Should have the correct `areAwardsDistributed` flag", () => {
            expect(rules.areAwardsDistributed).toBe(expected.rules.areAwardsDistributed);
          });

          it("Should have the correct `totalAwardPoolValue`", () => {
            if (
              rules.awardModel !== ReferralProgramAwardModels.Unrecognized &&
              expected.rules.awardModel !== ReferralProgramAwardModels.Unrecognized
            ) {
              expect(rules.totalAwardPoolValue).toStrictEqual(
                priceUsdc(BigInt(expected.rules.totalAwardPoolValue.amount)),
              );
            }
          });

          if (expected.rules.awardModel === ReferralProgramAwardModels.PieSplit) {
            const expectedPieSplitRules = expected.rules as ReferralProgramRulesPieSplit;

            it("Should have the correct `maxQualifiedReferrers`", () => {
              if (rules.awardModel === ReferralProgramAwardModels.PieSplit) {
                expect(rules.maxQualifiedReferrers).toBe(
                  expectedPieSplitRules.maxQualifiedReferrers,
                );
              }
            });
          }

          if (expected.rules.awardModel === ReferralProgramAwardModels.RevShareLimit) {
            const expectedRevShareLimitRules = expected.rules as ReferralProgramRulesRevShareLimit;

            it("Should have the correct `minQualifiedRevenueContribution`", () => {
              if (rules.awardModel === ReferralProgramAwardModels.RevShareLimit) {
                expect(rules.minQualifiedRevenueContribution).toStrictEqual(
                  priceUsdc(
                    BigInt(expectedRevShareLimitRules.minQualifiedRevenueContribution!.amount),
                  ),
                );
              }
            });

            it("Should have the correct `qualifiedRevenueShare`", () => {
              if (rules.awardModel === ReferralProgramAwardModels.RevShareLimit) {
                expect(rules.qualifiedRevenueShare).toBe(
                  expectedRevShareLimitRules.qualifiedRevenueShare,
                );
              }
            });
          }
        }
      });
    }
  });

  describe("Should have a valid structure", () => {
    it("Maintains the config set invariant (map key === config.slug)", () => {
      for (const [key, config] of configSet) {
        expect(key).toBe(config.slug);
      }
    });

    it("All editions have valid `slug` format", () => {
      for (const [slug] of configSet) {
        expect(slug).toMatch(REFERRAL_PROGRAM_EDITION_SLUG_PATTERN);
      }
    });

    it("All editions have non-empty `displayName`s", () => {
      for (const [, config] of configSet) {
        expect(config.displayName.length).toBeGreaterThan(0);
      }
    });

    it("All editions have `endTime` >= `startTime`", () => {
      for (const [, config] of configSet) {
        expect(config.rules.endTime).toBeGreaterThanOrEqual(config.rules.startTime);
      }
    });

    it("All editions have a recognized `awardModel`", () => {
      const recognizedModels: string[] = [
        ReferralProgramAwardModels.PieSplit,
        ReferralProgramAwardModels.RevShareLimit,
      ];
      for (const [, config] of configSet) {
        expect(recognizedModels).toContain(config.rules.awardModel);
      }
    });

    it("All editions have valid `rulesUrl`s", () => {
      for (const [, config] of configSet) {
        expect(config.rules.rulesUrl).toBeInstanceOf(URL);
        expect(config.rules.rulesUrl.protocol).toBe("https:");
      }
    });
  });

  describe("Error handling", () => {
    it("Throws for an unsupported namespace", () => {
      expect(() => getDefaultReferralProgramEditionConfigSet("invalid-namespace" as any)).toThrow();
    });
  });
});
