import { beforeEach, describe, expect, it } from "vitest";
import { resetMockConfig, setupConfigMock, updateMockConfig } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import { makeEventId, makeRegistrationId, makeResolverId } from "@/lib/ids";
import { labelhash, namehash, zeroAddress } from "viem";

const CHAIN_ID = 1337;

describe("ids", () => {
  beforeEach(() => {
    resetMockConfig();
  });

  describe("in any compatibility mode", () => {
    describe("makeResolverId", () => {
      it("should lowercase address", () => {
        expect(makeResolverId(CHAIN_ID, "0xCAFE", namehash("vitalik.eth"))).toMatch(
          /0xcafe-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835$/,
        );
      });
    });

    describe("makeEventId", () => {
      it("should include transferIndex if available", () => {
        expect(makeEventId(1, 123n, 456)).toMatch(/123-456$/);
        expect(makeEventId(1, 123n, 456, 1)).toMatch(/123-456-1$/);
      });
    });
  });

  describe("in subgraph compatibility mode", () => {
    beforeEach(() => {
      updateMockConfig({ isSubgraphCompatible: true });
    });

    describe("makeResolverId", () => {
      it("should construct subgraph-compatible resolver id", () => {
        expect(makeResolverId(CHAIN_ID, zeroAddress, namehash("vitalik.eth"))).toEqual(
          "0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        );
      });
    });

    describe("makeEventId", () => {
      it("should not include chainId if subgraph plugin", () => {
        expect(makeEventId(CHAIN_ID, 123n, 456)).toEqual("123-456");
      });
    });

    describe("makeRegistrationId", () => {
      it("should use the labelHash of the registered name", () => {
        expect(makeRegistrationId(labelhash("vitalik"), namehash("vitalik.eth"))).toEqual(
          labelhash("vitalik"),
        );
      });
    });
  });

  describe("not in subgraph compatibility mode", () => {
    describe("makeResolverId", () => {
      it("should construct chain-scoped resolver id", () => {
        expect(makeResolverId(CHAIN_ID, zeroAddress, namehash("vitalik.eth"))).toEqual(
          "1337-0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        );
      });
    });

    describe("makeEventId", () => {
      it("should construct chain-scoped event id", () => {
        expect(makeEventId(CHAIN_ID, 123n, 456)).toEqual("1337-123-456");
      });
    });

    describe("makeRegistrationId", () => {
      it("should use the node of the registered name", () => {
        expect(makeRegistrationId(labelhash("vitalik"), namehash("vitalik.linea.eth"))).toEqual(
          namehash("vitalik.linea.eth"),
        );
      });
    });
  });
});
