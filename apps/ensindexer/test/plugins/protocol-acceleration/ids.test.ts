import { describe, expect, it } from "vitest";

import {
  makeNodeResolverRelationId,
  makePrimaryNameId,
} from "@/plugins/protocol-acceleration/lib/ids";
import { DEFAULT_EVM_COIN_TYPE } from "@ensnode/ensnode-sdk";
import { namehash, zeroAddress } from "viem";

const CHAIN_ID = 1337;

describe("protocol-acceleration/ids", () => {
  describe("makeDomainResolverRelationId", () => {
    it("should create a unique ID with chain ID, domain ID, and resolver ID", () => {
      const node = namehash("vitalik.eth");
      expect(makeNodeResolverRelationId(CHAIN_ID, node)).toEqual(`${CHAIN_ID}-${node}`);
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
