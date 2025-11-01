import { namehash } from "viem";
import { describe, expect, it } from "vitest";

import { ETH_NODE, type UnixTimestamp } from "@ensnode/ensnode-sdk";

import {
  getIncrementalDurationForRegistration,
  getIncrementalDurationForRenewal,
} from "./registrar-action";
import type { Registration } from "./registration";

describe("Registrars", () => {
  describe("Registration Action", () => {
    it("can calculate incremental duration", () => {
      const eventArgExpiresAt: UnixTimestamp = 1234;
      const currentBlockTimestamp: UnixTimestamp = 1230;

      const incrementalDuration = getIncrementalDurationForRegistration(
        currentBlockTimestamp,
        eventArgExpiresAt,
      );

      expect(incrementalDuration).toEqual(4);
    });
  });

  describe("Renewal Action", () => {
    it("can calculate incremental duration", () => {
      const eventArgExpiresAt: UnixTimestamp = 1288;

      const currentRegistration = {
        node: namehash("test.eth"),
        parentNode: ETH_NODE,
        expiresAt: 1234,
      } satisfies Registration;

      const incrementalDuration = getIncrementalDurationForRenewal(
        currentRegistration,
        eventArgExpiresAt,
      );

      expect(incrementalDuration).toEqual(54);
    });
  });
});
