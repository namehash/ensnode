import { describe, expect, it } from "vitest";

import {
  isRegistrationExpired,
  isRegistrationFullyExpired,
  isRegistrationInGracePeriod,
} from "./registration-expiration";

describe("registration expiration", () => {
  const expiry = 1000n;
  const gracePeriod = 100n;

  describe("isRegistrationExpired", () => {
    it.each([
      { now: 999n, expected: false, description: "before expiry" },
      { now: 1000n, expected: true, description: "at expiry" },
      { now: 1001n, expected: true, description: "after expiry" },
    ])("returns $expected when $description", ({ now, expected }) => {
      expect(isRegistrationExpired({ expiry, gracePeriod }, now)).toBe(expected);
    });

    it("returns false when expiry is null", () => {
      expect(isRegistrationExpired({ expiry: null, gracePeriod }, 2000n)).toBe(false);
    });
  });

  describe("isRegistrationFullyExpired", () => {
    it.each([
      { now: 999n, expected: false, description: "before expiry" },
      { now: 1000n, expected: false, description: "at expiry" },
      { now: 1050n, expected: false, description: "during grace period" },
      { now: 1100n, expected: false, description: "at expiry + grace period" },
      { now: 1101n, expected: true, description: "after expiry + grace period" },
    ])("returns $expected when $description", ({ now, expected }) => {
      expect(isRegistrationFullyExpired({ expiry, gracePeriod }, now)).toBe(expected);
    });

    it("returns false when expiry is null", () => {
      expect(isRegistrationFullyExpired({ expiry: null, gracePeriod }, 2000n)).toBe(false);
    });

    it("treats null grace period as zero", () => {
      expect(isRegistrationFullyExpired({ expiry, gracePeriod: null }, 1000n)).toBe(false);
      expect(isRegistrationFullyExpired({ expiry, gracePeriod: null }, 1001n)).toBe(true);
    });
  });

  describe("isRegistrationInGracePeriod", () => {
    it.each([
      { now: 999n, expected: false, description: "before expiry" },
      { now: 1000n, expected: true, description: "at expiry" },
      { now: 1050n, expected: true, description: "during grace period" },
      { now: 1100n, expected: false, description: "at expiry + grace period" },
      { now: 1101n, expected: false, description: "after expiry + grace period" },
    ])("returns $expected when $description", ({ now, expected }) => {
      expect(isRegistrationInGracePeriod({ expiry, gracePeriod }, now)).toBe(expected);
    });

    it("returns false when expiry is null", () => {
      expect(isRegistrationInGracePeriod({ expiry: null, gracePeriod }, 1050n)).toBe(false);
    });

    it("returns false when grace period is null", () => {
      expect(isRegistrationInGracePeriod({ expiry, gracePeriod: null }, 1050n)).toBe(false);
    });
  });
});
