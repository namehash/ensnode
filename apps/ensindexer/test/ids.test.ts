import { beforeEach, describe, expect, it } from "vitest";
import { resetMockConfig, setupConfigMock, updateMockConfig } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import {
  makeDomainResolverRelationId,
  makeEventId,
  makePrimaryNameId,
  makeRegistrationId,
  makeResolverId,
  parseResolverId,
} from "@/lib/ids";
import { DEFAULT_EVM_COIN_TYPE } from "@ensnode/ensnode-sdk";
import { labelhash, namehash, zeroAddress } from "viem";

const CHAIN_ID = 1337;

describe("ids", () => {
  beforeEach(() => {
    resetMockConfig();
  });

  describe("in any compatibility mode", () => {
    describe("makeResolverId", () => {
      it("should lowercase address", () => {
        expect(
          makeResolverId(
            CHAIN_ID,
            "0x2aaecbf301b736859333be66942cb6dbd3e9cafe",
            namehash("vitalik.eth"),
          ),
        ).toEqual(
          "1337-0x2aaecbf301b736859333be66942cb6dbd3e9cafe-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        );
      });
    });

    describe("parseResolverId", () => {
      it("should throw error for invalid format", () => {
        expect(() => parseResolverId("invalid")).toThrow("Invalid resolver ID format");
        expect(() => parseResolverId("1-2-3-4")).toThrow("Invalid resolver ID format");
      });
    });

    describe("makeEventId", () => {
      it("should include transferIndex if available", () => {
        expect(makeEventId(1, 123n, 456)).toMatch(/123-456$/);
        expect(makeEventId(1, 123n, 456, 1)).toMatch(/123-456-1$/);
      });
    });

    describe("makeDomainResolverRelationId", () => {
      it("should create a unique ID with chain ID, domain ID, and resolver ID", () => {
        const domainId = namehash("vitalik.eth");
        expect(makeDomainResolverRelationId(CHAIN_ID, domainId)).toEqual(`${CHAIN_ID}-${domainId}`);
      });
    });
  });

  describe("in subgraph compatibility mode", () => {
    beforeEach(() => {
      updateMockConfig({ isSubgraphCompatible: true });
    });

    describe("makeResolverId", () => {
      it("should not include chain id", () => {
        expect(makeResolverId(CHAIN_ID, zeroAddress, namehash("vitalik.eth"))).toEqual(
          "0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        );
      });
    });

    describe("parseResolverId", () => {
      it("should parse subgraph-compatible format", () => {
        const node = namehash("vitalik.eth");
        const resolverId = makeResolverId(CHAIN_ID, zeroAddress, node);
        expect(parseResolverId(resolverId)).toEqual({ chainId: null, address: zeroAddress, node });
      });
    });

    describe("makeEventId", () => {
      it("should not include chain id", () => {
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
      it("should include chain id", () => {
        expect(makeResolverId(CHAIN_ID, zeroAddress, namehash("vitalik.eth"))).toEqual(
          "1337-0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        );
      });
    });

    describe("parseResolverId", () => {
      it("should parse chain-scoped format", () => {
        const node = namehash("vitalik.eth");
        const resolverId = makeResolverId(CHAIN_ID, zeroAddress, node);
        expect(parseResolverId(resolverId)).toEqual({
          chainId: CHAIN_ID,
          address: zeroAddress,
          node,
        });
      });
    });

    describe("makeEventId", () => {
      it("should include chain id", () => {
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

    describe("makePrimaryNameId", () => {
      it("should construct primary name id", () => {
        expect(makePrimaryNameId(zeroAddress, DEFAULT_EVM_COIN_TYPE)).toEqual(
          `${zeroAddress}-80000000`,
        );
      });
    });
  });
});
